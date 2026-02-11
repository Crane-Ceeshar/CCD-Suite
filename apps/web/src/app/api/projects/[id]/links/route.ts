import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

const createLinkSchema = z.object({
  linked_entity_type: z.enum(['deal', 'content_item', 'seo_project']),
  linked_entity_id: z.string().uuid(),
});

/**
 * GET /api/projects/:id/links
 * List cross-module links for a project. Joins to get linked entity name where possible.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { id: projectId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'project-links:list' });
  if (limited) return limitResp!;

  // Fetch raw links
  const { data: links, error: queryError } = await supabase
    .from('project_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch project links');
  }

  if (!links || links.length === 0) {
    return success([]);
  }

  // Enrich links with entity names by type
  const dealIds = links.filter((l: { linked_entity_type: string }) => l.linked_entity_type === 'deal').map((l: { linked_entity_id: string }) => l.linked_entity_id);
  const contentIds = links.filter((l: { linked_entity_type: string }) => l.linked_entity_type === 'content_item').map((l: { linked_entity_id: string }) => l.linked_entity_id);
  const seoIds = links.filter((l: { linked_entity_type: string }) => l.linked_entity_type === 'seo_project').map((l: { linked_entity_id: string }) => l.linked_entity_id);

  const nameMap = new Map<string, string>();

  // Fetch deal names
  if (dealIds.length > 0) {
    const { data: deals } = await supabase
      .from('deals')
      .select('id, name')
      .in('id', dealIds);
    (deals ?? []).forEach((d: { id: string; name: string }) => nameMap.set(d.id, d.name));
  }

  // Fetch content item names
  if (contentIds.length > 0) {
    const { data: items } = await supabase
      .from('content_items')
      .select('id, title')
      .in('id', contentIds);
    (items ?? []).forEach((c: { id: string; title: string }) => nameMap.set(c.id, c.title));
  }

  // Fetch SEO project names
  if (seoIds.length > 0) {
    const { data: seoProjects } = await supabase
      .from('seo_projects')
      .select('id, name')
      .in('id', seoIds);
    (seoProjects ?? []).forEach((s: { id: string; name: string }) => nameMap.set(s.id, s.name));
  }

  // Merge names into links
  const enriched = links.map((link: { linked_entity_id: string; [key: string]: unknown }) => ({
    ...link,
    linked_entity_name: nameMap.get(link.linked_entity_id) ?? null,
  }));

  return success(enriched);
}

/**
 * POST /api/projects/:id/links
 * Create a cross-module link for a project.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id: projectId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'project-links:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createLinkSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('project_links')
    .insert({
      tenant_id: profile.tenant_id,
      project_id: projectId,
      linked_entity_type: body.linked_entity_type,
      linked_entity_id: body.linked_entity_id,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create project link');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project_link.created',
    resource_type: 'project_link',
    resource_id: data.id,
    details: {
      project_id: projectId,
      linked_entity_type: body.linked_entity_type,
      linked_entity_id: body.linked_entity_id,
    },
  });

  return success(data, 201);
}

/**
 * DELETE /api/projects/:id/links?linkId=UUID
 * Delete a cross-module link.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id: projectId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'project-links:delete' });
  if (limited) return limitResp!;

  const linkId = request.nextUrl.searchParams.get('linkId');
  if (!linkId) {
    return error('linkId query parameter is required', 400);
  }

  // Verify the link exists and belongs to this project
  const { data: existing, error: fetchError } = await supabase
    .from('project_links')
    .select('id, linked_entity_type, linked_entity_id')
    .eq('id', linkId)
    .eq('project_id', projectId)
    .maybeSingle();

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch project link');
  }

  if (!existing) {
    return notFound('Project link');
  }

  const { error: deleteError } = await supabase
    .from('project_links')
    .delete()
    .eq('id', linkId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete project link');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project_link.deleted',
    resource_type: 'project_link',
    resource_id: linkId,
    details: {
      project_id: projectId,
      linked_entity_type: existing.linked_entity_type,
      linked_entity_id: existing.linked_entity_id,
    },
  });

  return success({ deleted: true });
}
