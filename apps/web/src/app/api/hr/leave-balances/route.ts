import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, error as apiError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { leaveBalanceQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { z } from 'zod';

const createLeaveBalanceSchema = z.object({
  employee_id: z.string().uuid(),
  leave_type: z.enum(['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid']),
  year: z.number().int().positive(),
  total_days: z.number().nonnegative(),
  carry_over_days: z.number().nonnegative().default(0),
});

/**
 * GET /api/hr/leave-balances
 * Get leave balances for an employee, optionally filtered by year.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:leave-balances:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    leaveBalanceQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { employee_id, year } = query!;

  if (!employee_id) {
    return apiError('employee_id is required', 400);
  }

  const { data, error: queryError } = await supabase
    .from('leave_balances')
    .select('*')
    .eq('employee_id', employee_id)
    .eq('year', year);

  if (queryError) {
    return dbError(queryError, 'Failed to fetch leave balances');
  }

  return NextResponse.json({ success: true, data });
}

/**
 * POST /api/hr/leave-balances
 * Create or adjust a leave balance.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave-balances:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createLeaveBalanceSchema);
  if (bodyError) return bodyError;

  const { data: balance, error: insertError } = await supabase
    .from('leave_balances')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      leave_type: body.leave_type,
      year: body.year,
      total_days: body.total_days,
      carry_over_days: body.carry_over_days,
      used_days: 0,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create leave balance');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave_balance.created',
    resource_type: 'leave_balance',
    resource_id: balance.id,
    details: { employee_id: body.employee_id, leave_type: body.leave_type, year: body.year },
  });

  return success(balance, 201);
}
