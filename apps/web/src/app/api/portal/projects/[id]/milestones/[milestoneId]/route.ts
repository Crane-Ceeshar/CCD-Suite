import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateMilestoneSchema } from '@/lib/api/schemas/portal';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * PATCH /api/portal/projects/:id/milestones/:milestoneId
 * Update a milestone (status, title, due_date, etc.).
 * Auto-sets completed_at when status changes to 'completed'.
 * Auto-recalculates portal project progress.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, milestoneId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'portal:milestones:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateMilestoneSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  const allowedFields = ['title', 'description', 'due_date', 'status', 'position'] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  // Auto-set completed_at
  if (body.status === 'completed') {
    updateFields.completed_at = new Date().toISOString();
  } else if (body.status) {
    updateFields.completed_at = null;
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('portal_milestones')
    .update(updateFields)
    .eq('id', milestoneId)
    .eq('portal_project_id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Milestone');
  }

  // Recalculate project progress: (completed / total) * 100
  const { data: allMilestones } = await supabase
    .from('portal_milestones')
    .select('status')
    .eq('portal_project_id', id);

  if (allMilestones && allMilestones.length > 0) {
    const total = allMilestones.length;
    const completed = allMilestones.filter((m: { status: string }) => m.status === 'completed').length;
    const progress = Math.round((completed / total) * 100);

    await supabase
      .from('portal_projects')
      .update({ progress })
      .eq('id', id);
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_milestone.updated',
    resource_type: 'portal_milestone',
    resource_id: milestoneId,
    details: { title: data.title, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/portal/projects/:id/milestones/:milestoneId
 * Delete a milestone and recalculate progress.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, milestoneId } = await params;

  const { data: milestone, error: fetchError } = await supabase
    .from('portal_milestones')
    .select('id, title')
    .eq('id', milestoneId)
    .eq('portal_project_id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Milestone');
  }

  const { error: deleteError } = await supabase
    .from('portal_milestones')
    .delete()
    .eq('id', milestoneId)
    .eq('portal_project_id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete milestone');
  }

  // Recalculate project progress
  const { data: remaining } = await supabase
    .from('portal_milestones')
    .select('status')
    .eq('portal_project_id', id);

  if (remaining && remaining.length > 0) {
    const total = remaining.length;
    const completed = remaining.filter((m: { status: string }) => m.status === 'completed').length;
    const progress = Math.round((completed / total) * 100);
    await supabase.from('portal_projects').update({ progress }).eq('id', id);
  } else {
    await supabase.from('portal_projects').update({ progress: 0 }).eq('id', id);
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_milestone.deleted',
    resource_type: 'portal_milestone',
    resource_id: milestoneId,
    details: { title: milestone.title, portal_project_id: id },
  });

  return success({ deleted: true });
}
