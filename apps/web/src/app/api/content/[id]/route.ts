import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { contentUpdateSchema } from '@/lib/api/schemas/content';
import { logAudit } from '@/lib/api/audit';
import { canTransition, type ContentStatus } from '@/lib/content/status-machine';
import { checkContentPermission } from '@/lib/api/permissions';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/content/:id
 * Get a single content item with category and assets.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('content_items')
    .select('*, category:content_categories(id, name, slug, color)')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Content item');
  }

  // Also fetch assets
  const { data: assets } = await supabase
    .from('content_assets')
    .select('*')
    .eq('content_item_id', id)
    .order('created_at', { ascending: false });

  return success({ ...data, assets: assets ?? [] });
}

/**
 * PATCH /api/content/:id
 * Update a content item.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'content:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, contentUpdateSchema);
  if (bodyError) return bodyError;

  // ── Permission check ─────────────────────────────────────────────
  // writer+ can edit own content, editor+ can edit any
  const perm = await checkContentPermission(supabase, user.id, profile.tenant_id, 'writer');
  if (!perm.allowed) return perm.error!;

  // If not editor+, verify ownership
  if (perm.role && ['writer'].includes(perm.role)) {
    const { data: owner } = await supabase
      .from('content_items')
      .select('created_by')
      .eq('id', id)
      .single();
    if (owner && owner.created_by !== user.id) {
      return errorResponse('You can only edit your own content', 403);
    }
  }

  // publisher+ required for publishing
  if (body.status === 'published') {
    const pubPerm = await checkContentPermission(supabase, user.id, profile.tenant_id, 'publisher');
    if (!pubPerm.allowed) return pubPerm.error!;
  }

  // ── Conflict detection: check expected_updated_at ────────────────
  if (body.expected_updated_at) {
    const { data: current, error: fetchError } = await supabase
      .from('content_items')
      .select('updated_at, status')
      .eq('id', id)
      .single();

    if (fetchError) return dbError(fetchError, 'Content item');

    if (current.updated_at && current.updated_at !== body.expected_updated_at) {
      return errorResponse(
        'Content has been modified by another user. Reload to see latest changes.',
        409
      );
    }

    // ── Status transition validation ──────────────────────────────
    if (body.status && body.status !== current.status) {
      if (!canTransition(current.status as ContentStatus, body.status as ContentStatus)) {
        return errorResponse('Invalid status transition', 400);
      }
    }
  } else if (body.status) {
    // Even without conflict detection, validate status transitions
    const { data: current, error: fetchError } = await supabase
      .from('content_items')
      .select('status')
      .eq('id', id)
      .single();

    if (!fetchError && current.status !== body.status) {
      if (!canTransition(current.status as ContentStatus, body.status as ContentStatus)) {
        return errorResponse('Invalid status transition', 400);
      }
    }
  }

  // Build update fields — only include provided fields
  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'title', 'slug', 'content_type', 'body', 'excerpt', 'status',
    'publish_date', 'platforms', 'tags', 'seo_title', 'seo_description',
    'featured_image_url', 'metadata', 'category_id',
  ] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  // Auto-generate slug if title changed but slug not provided
  if (body.title && !body.slug) {
    updateFields.slug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  const { data, error: updateError } = await supabase
    .from('content_items')
    .update(updateFields)
    .eq('id', id)
    .select('*, category:content_categories(id, name, slug, color)')
    .single();

  if (updateError) {
    return dbError(updateError, 'Content item');
  }

  // Fire-and-forget audit log
  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'content.updated',
    resource_type: 'content_item',
    resource_id: id,
    details: { title: data.title, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/content/:id
 * Archive or permanently delete a content item.
 * Use ?hard=true to permanently delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const hard = request.nextUrl.searchParams.get('hard') === 'true';

  // editor+ can delete any content, writer can only delete own
  const perm = await checkContentPermission(supabase, user.id, profile.tenant_id, 'writer');
  if (!perm.allowed) return perm.error!;

  if (perm.role && ['writer'].includes(perm.role)) {
    const { data: owner } = await supabase
      .from('content_items')
      .select('created_by')
      .eq('id', id)
      .single();
    if (owner && owner.created_by !== user.id) {
      return errorResponse('You can only delete your own content', 403);
    }
  }

  if (hard) {
    // First delete related assets and approvals
    await supabase.from('content_assets').delete().eq('content_item_id', id);
    await supabase.from('content_approvals').delete().eq('content_item_id', id);

    const { error: deleteError } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return dbError(deleteError, 'Failed to delete content');
    }
  } else {
    // Soft delete — archive
    const { error: archiveError } = await supabase
      .from('content_items')
      .update({ status: 'archived' })
      .eq('id', id);

    if (archiveError) {
      return dbError(archiveError, 'Failed to archive content');
    }
  }

  // Fire-and-forget audit log
  logAudit(supabase, profile.tenant_id, user.id, {
    action: hard ? 'content.deleted' : 'content.archived',
    resource_type: 'content_item',
    resource_id: id,
    details: { hard },
  });

  return success({ deleted: true });
}
