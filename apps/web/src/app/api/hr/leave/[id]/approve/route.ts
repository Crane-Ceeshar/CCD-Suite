import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { approveLeaveSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * POST /api/hr/leave/:id/approve
 * Approve or reject a leave request.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave:approve' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, approveLeaveSchema);
  if (bodyError) return bodyError;

  const { action, notes } = body;

  // Fetch the leave request to verify it exists and is pending
  const { data: leaveRequest, error: fetchError } = await supabase
    .from('leave_requests')
    .select('id, employee_id, type, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Leave request');
  }

  if (leaveRequest.status !== 'pending') {
    return errorResponse(`Leave request is already ${leaveRequest.status}`, 400);
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  const { data, error: updateError } = await supabase
    .from('leave_requests')
    .update({
      status: newStatus,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to update leave request');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: action === 'approve' ? 'leave.approved' : 'leave.rejected',
    resource_type: 'leave_request',
    resource_id: id,
    details: { employee_id: leaveRequest.employee_id, type: leaveRequest.type, status: newStatus },
  });

  return success(data);
}
