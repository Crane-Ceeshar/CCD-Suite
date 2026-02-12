import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, notFound } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateLeavePolicySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * PATCH /api/hr/leave-policies/[id]
 * Update a leave policy.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave-policies:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateLeavePolicySchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.employment_type !== undefined) updateFields.employment_type = body.employment_type;
  if (body.leave_type !== undefined) updateFields.leave_type = body.leave_type;
  if (body.days_per_year !== undefined) updateFields.days_per_year = body.days_per_year;
  if (body.carry_over_max !== undefined) updateFields.carry_over_max = body.carry_over_max;
  if (body.requires_approval !== undefined) updateFields.requires_approval = body.requires_approval;
  if (body.min_notice_days !== undefined) updateFields.min_notice_days = body.min_notice_days;
  if (body.max_consecutive_days !== undefined) updateFields.max_consecutive_days = body.max_consecutive_days;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  const { data: policy, error: updateError } = await supabase
    .from('leave_policies')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Leave policy not found');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave_policy.updated',
    resource_type: 'leave_policy',
    resource_id: id,
    details: body,
  });

  return success(policy);
}

/**
 * DELETE /api/hr/leave-policies/[id]
 * Delete a leave policy.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave-policies:delete' });
  if (limited) return limitResp!;

  const { data: policy, error: fetchError } = await supabase
    .from('leave_policies')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Leave policy not found');
  }

  const { error: deleteError } = await supabase
    .from('leave_policies')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete leave policy');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave_policy.deleted',
    resource_type: 'leave_policy',
    resource_id: id,
    details: { name: policy.name },
  });

  return success({ deleted: true });
}
