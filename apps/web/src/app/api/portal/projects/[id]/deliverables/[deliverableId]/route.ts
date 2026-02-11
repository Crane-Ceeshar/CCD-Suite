import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateDeliverableSchema } from '@/lib/api/schemas/portal';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * PATCH /api/portal/projects/:id/deliverables/:deliverableId
 * Update a deliverable (review workflow: status transitions, feedback).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; deliverableId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, deliverableId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'portal:deliverables:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateDeliverableSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  const allowedFields = ['title', 'description', 'status', 'feedback', 'file_url', 'file_name', 'file_size'] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  // Auto-set reviewed_at when status changes to approved or delivered
  if (body.status === 'approved' || body.status === 'delivered') {
    updateFields.reviewed_at = new Date().toISOString();
    updateFields.reviewed_by = user.id;
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('portal_deliverables')
    .update(updateFields)
    .eq('id', deliverableId)
    .eq('portal_project_id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Deliverable');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_deliverable.updated',
    resource_type: 'portal_deliverable',
    resource_id: deliverableId,
    details: { title: data.title, status: data.status, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/portal/projects/:id/deliverables/:deliverableId
 * Delete a deliverable.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; deliverableId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, deliverableId } = await params;

  const { data: deliverable, error: fetchError } = await supabase
    .from('portal_deliverables')
    .select('id, title')
    .eq('id', deliverableId)
    .eq('portal_project_id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Deliverable');
  }

  const { error: deleteError } = await supabase
    .from('portal_deliverables')
    .delete()
    .eq('id', deliverableId)
    .eq('portal_project_id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete deliverable');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_deliverable.deleted',
    resource_type: 'portal_deliverable',
    resource_id: deliverableId,
    details: { title: deliverable.title, portal_project_id: id },
  });

  return success({ deleted: true });
}
