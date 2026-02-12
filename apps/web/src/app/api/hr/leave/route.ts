import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createLeaveRequestSchema, leaveListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/leave
 * List leave requests with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:leave:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    leaveListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { status, employee_id, type, from: fromDate, to: toDate, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('leave_requests')
    .select(
      '*, employee:employees(id, first_name, last_name, department:departments!department_id(id, name))',
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (employee_id) {
    dbQuery = dbQuery.eq('employee_id', employee_id);
  }
  if (type) {
    dbQuery = dbQuery.eq('type', type);
  }
  if (fromDate) {
    dbQuery = dbQuery.gte('start_date', fromDate);
  }
  if (toDate) {
    dbQuery = dbQuery.lte('start_date', toDate);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch leave requests');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/hr/leave
 * Create a new leave request.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:leave:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createLeaveRequestSchema);
  if (bodyError) return bodyError;

  const { data: leaveRequest, error: insertError } = await supabase
    .from('leave_requests')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      type: body.type,
      start_date: body.start_date,
      end_date: body.end_date,
      days_count: body.days_count,
      reason: body.reason ?? null,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create leave request');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave.requested',
    resource_type: 'leave_request',
    resource_id: leaveRequest.id,
    details: { employee_id: body.employee_id, type: body.type, days_count: body.days_count },
  });

  return success(leaveRequest, 201);
}
