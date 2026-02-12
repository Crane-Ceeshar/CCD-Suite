import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createAttendanceSchema, attendanceListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/attendance
 * List attendance records with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:attendance:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    attendanceListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { employee_id, status, from, to, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('attendance')
    .select('*, employee:employees(id, first_name, last_name)', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (employee_id) {
    dbQuery = dbQuery.eq('employee_id', employee_id);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (from) {
    dbQuery = dbQuery.gte('date', from);
  }
  if (to) {
    dbQuery = dbQuery.lte('date', to);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch attendance records');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/hr/attendance
 * Record a new attendance entry.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:attendance:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createAttendanceSchema);
  if (bodyError) return bodyError;

  // Auto-calculate hours_worked if both clock_in and clock_out are provided
  let hours_worked: number | null = null;
  if (body.clock_in && body.clock_out) {
    const cin = new Date(body.clock_in);
    const cout = new Date(body.clock_out);
    const diffMs = cout.getTime() - cin.getTime();
    hours_worked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  }

  const { data, error: insertError } = await supabase
    .from('attendance')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      date: body.date,
      clock_in: body.clock_in ?? null,
      clock_out: body.clock_out ?? null,
      hours_worked,
      status: body.status,
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to record attendance');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'attendance.recorded',
    resource_type: 'attendance',
    resource_id: data.id,
    details: { employee_id: body.employee_id, date: body.date, status: body.status },
  });

  return success(data, 201);
}
