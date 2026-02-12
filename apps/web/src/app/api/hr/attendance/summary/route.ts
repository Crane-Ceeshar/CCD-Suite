import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/hr/attendance/summary
 * Monthly per-employee attendance summary.
 * Query params: month (YYYY-MM), employee_id (optional)
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'hr:attendance:summary' });
  if (limited) return limitResp!;

  const month = request.nextUrl.searchParams.get('month');
  const employeeId = request.nextUrl.searchParams.get('employee_id');

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { success: false, error: { message: 'month query parameter is required (format: YYYY-MM)' } },
      { status: 400 }
    );
  }

  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const mon = parseInt(monthStr, 10);

  // Calculate start and end dates for the month
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const endDate = `${year}-${String(mon).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  let dbQuery = supabase
    .from('attendance_records')
    .select('employee_id, date, status, hours_worked, employee:employees(id, first_name, last_name)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('employee_id', { ascending: true })
    .order('date', { ascending: true });

  if (employeeId) {
    dbQuery = dbQuery.eq('employee_id', employeeId);
  }

  const { data, error: queryError } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch attendance summary');
  }

  // Aggregate per employee
  const employeeMap = new Map<string, {
    employee_id: string;
    employee_name: string;
    present_days: number;
    absent_days: number;
    late_days: number;
    half_days: number;
    total_hours: number;
    working_days: number;
  }>();

  for (const record of data ?? []) {
    const empId = record.employee_id;
    const employee = record.employee as unknown as { first_name: string; last_name: string } | null;
    const empName = employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown';

    if (!employeeMap.has(empId)) {
      employeeMap.set(empId, {
        employee_id: empId,
        employee_name: empName,
        present_days: 0,
        absent_days: 0,
        late_days: 0,
        half_days: 0,
        total_hours: 0,
        working_days: 0,
      });
    }

    const summary = employeeMap.get(empId)!;
    summary.working_days++;

    switch (record.status) {
      case 'present':
        summary.present_days++;
        break;
      case 'absent':
        summary.absent_days++;
        break;
      case 'late':
        summary.late_days++;
        break;
      case 'half_day':
        summary.half_days++;
        break;
    }

    if (record.hours_worked != null) {
      summary.total_hours += Number(record.hours_worked);
    }
  }

  // Round hours
  const summaries = Array.from(employeeMap.values()).map((s) => ({
    ...s,
    total_hours: Math.round(s.total_hours * 100) / 100,
  }));

  return NextResponse.json({
    success: true,
    data: summaries,
    meta: { month, start_date: startDate, end_date: endDate },
  });
}
