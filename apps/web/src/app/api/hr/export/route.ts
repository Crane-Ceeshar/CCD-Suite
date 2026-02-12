import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { hrExportSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * POST /api/hr/export
 * Export employees, leave, attendance, or payroll as CSV.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 10, keyPrefix: 'hr:export' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, hrExportSchema);
  if (bodyError) return bodyError;

  const { type, status, from, to } = body;

  try {
    let csvContent = '';
    let filename = '';

    if (type === 'employees') {
      let dbQuery = supabase
        .from('employees')
        .select('first_name, last_name, email, phone, department:departments!department_id(name), job_title, employment_type, status, hire_date, salary')
        .order('last_name', { ascending: true });

      if (status) dbQuery = dbQuery.eq('status', status);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export employees');

      const rows = data ?? [];
      csvContent = 'First Name,Last Name,Email,Phone,Department,Job Title,Employment Type,Status,Hire Date,Salary\n';
      for (const row of rows) {
        const department = row.department as unknown as { name: string } | null;
        csvContent += [
          escapeCsv(row.first_name),
          escapeCsv(row.last_name),
          escapeCsv(row.email),
          escapeCsv(row.phone),
          escapeCsv(department?.name ?? ''),
          escapeCsv(row.job_title),
          escapeCsv(row.employment_type),
          escapeCsv(row.status),
          escapeCsv(row.hire_date),
          row.salary ?? '',
        ].join(',') + '\n';
      }
      filename = `employees_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'leave') {
      let dbQuery = supabase
        .from('leave_requests')
        .select('employee:employees(first_name, last_name), type, start_date, end_date, days_count, status, reason')
        .order('start_date', { ascending: false });

      if (status) dbQuery = dbQuery.eq('status', status);
      if (from) dbQuery = dbQuery.gte('start_date', from);
      if (to) dbQuery = dbQuery.lte('start_date', to);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export leave requests');

      const rows = data ?? [];
      csvContent = 'Employee Name,Type,Start Date,End Date,Days Count,Status,Reason\n';
      for (const row of rows) {
        const employee = row.employee as unknown as { first_name: string; last_name: string } | null;
        csvContent += [
          escapeCsv(employee ? `${employee.first_name} ${employee.last_name}` : ''),
          escapeCsv(row.type),
          escapeCsv(row.start_date),
          escapeCsv(row.end_date),
          row.days_count ?? 0,
          escapeCsv(row.status),
          escapeCsv(row.reason),
        ].join(',') + '\n';
      }
      filename = `leave_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'attendance') {
      let dbQuery = supabase
        .from('attendance_records')
        .select('employee:employees(first_name, last_name), date, clock_in, clock_out, hours_worked, status')
        .order('date', { ascending: false });

      if (status) dbQuery = dbQuery.eq('status', status);
      if (from) dbQuery = dbQuery.gte('date', from);
      if (to) dbQuery = dbQuery.lte('date', to);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export attendance');

      const rows = data ?? [];
      csvContent = 'Employee Name,Date,Clock In,Clock Out,Hours Worked,Status\n';
      for (const row of rows) {
        const employee = row.employee as unknown as { first_name: string; last_name: string } | null;
        csvContent += [
          escapeCsv(employee ? `${employee.first_name} ${employee.last_name}` : ''),
          escapeCsv(row.date),
          escapeCsv(row.clock_in),
          escapeCsv(row.clock_out),
          row.hours_worked ?? '',
          escapeCsv(row.status),
        ].join(',') + '\n';
      }
      filename = `attendance_export_${new Date().toISOString().split('T')[0]}.csv`;

    } else if (type === 'payroll') {
      let dbQuery = supabase
        .from('payroll_runs')
        .select('period_start, period_end, status, total_gross, total_deductions, total_net, currency')
        .order('period_start', { ascending: false });

      if (status) dbQuery = dbQuery.eq('status', status);
      if (from) dbQuery = dbQuery.gte('period_start', from);
      if (to) dbQuery = dbQuery.lte('period_end', to);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export payroll');

      const rows = data ?? [];
      csvContent = 'Period Start,Period End,Status,Total Gross,Total Deductions,Total Net,Currency\n';
      for (const row of rows) {
        csvContent += [
          escapeCsv(row.period_start),
          escapeCsv(row.period_end),
          escapeCsv(row.status),
          row.total_gross ?? 0,
          row.total_deductions ?? 0,
          row.total_net ?? 0,
          escapeCsv(row.currency),
        ].join(',') + '\n';
      }
      filename = `payroll_export_${new Date().toISOString().split('T')[0]}.csv`;
    }

    logAudit(supabase, profile.tenant_id, user.id, {
      action: 'hr.exported',
      resource_type: type,
      details: { type, status: status ?? 'all', from: from ?? 'all', to: to ?? 'all' },
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate export' } },
      { status: 500 }
    );
  }
}

/** Escape a value for CSV output */
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
