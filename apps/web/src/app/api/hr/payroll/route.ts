import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createPayrollRunSchema, payrollListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/payroll
 * List payroll runs with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:payroll:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    payrollListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { status, from, to, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('payroll_runs')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (from) {
    dbQuery = dbQuery.gte('period_start', from);
  }
  if (to) {
    dbQuery = dbQuery.lte('period_end', to);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch payroll runs');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/hr/payroll
 * Create a new payroll run.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:payroll:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createPayrollRunSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('payroll_runs')
    .insert({
      tenant_id: profile.tenant_id,
      period_start: body.period_start,
      period_end: body.period_end,
      currency: body.currency,
      notes: body.notes ?? null,
      status: 'draft',
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create payroll run');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'payroll.created',
    resource_type: 'payroll_run',
    resource_id: data.id,
    details: { period_start: body.period_start, period_end: body.period_end },
  });

  return success(data, 201);
}
