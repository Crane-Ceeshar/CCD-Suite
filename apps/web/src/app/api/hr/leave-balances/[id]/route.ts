import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, notFound } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateLeaveBalanceSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * PATCH /api/hr/leave-balances/[id]
 * Update a leave balance record.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave-balances:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateLeaveBalanceSchema);
  if (bodyError) return bodyError;

  const { data: balance, error: updateError } = await supabase
    .from('leave_balances')
    .update({
      ...(body.total_days !== undefined && { total_days: body.total_days }),
      ...(body.used_days !== undefined && { used_days: body.used_days }),
      ...(body.carry_over_days !== undefined && { carry_over_days: body.carry_over_days }),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Leave balance not found');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave_balance.updated',
    resource_type: 'leave_balance',
    resource_id: id,
    details: body,
  });

  return success(balance);
}
