import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updatePortalProjectSchema } from '@/lib/api/schemas/portal';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/portal/projects/:id
 * Get a single portal project with milestones, deliverables, and messages.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('portal_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Portal project');
  }

  // Fetch milestones, deliverables, and recent messages in parallel
  const [milestonesRes, deliverablesRes, messagesRes] = await Promise.all([
    supabase
      .from('portal_milestones')
      .select('*')
      .eq('portal_project_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('portal_deliverables')
      .select('*')
      .eq('portal_project_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('portal_messages')
      .select('*')
      .eq('portal_project_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return success({
    ...data,
    milestones: milestonesRes.data ?? [],
    deliverables: deliverablesRes.data ?? [],
    messages: messagesRes.data ?? [],
  });
}

/**
 * PATCH /api/portal/projects/:id
 * Update a portal project.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'portal:projects:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updatePortalProjectSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'name', 'description', 'project_id', 'client_id', 'status',
    'start_date', 'end_date', 'budget', 'progress', 'metadata',
  ] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('portal_projects')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Portal project');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_project.updated',
    resource_type: 'portal_project',
    resource_id: id,
    details: { name: data.name, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/portal/projects/:id
 * Delete a portal project with cascade.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: project, error: fetchError } = await supabase
    .from('portal_projects')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Portal project');
  }

  // Delete related data
  await supabase.from('portal_messages').delete().eq('portal_project_id', id);
  await supabase.from('portal_deliverables').delete().eq('portal_project_id', id);
  await supabase.from('portal_milestones').delete().eq('portal_project_id', id);
  await supabase.from('portal_access_tokens').delete().eq('portal_project_id', id);

  const { error: deleteError } = await supabase
    .from('portal_projects')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete portal project');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_project.deleted',
    resource_type: 'portal_project',
    resource_id: id,
    details: { name: project.name },
  });

  return success({ deleted: true });
}
