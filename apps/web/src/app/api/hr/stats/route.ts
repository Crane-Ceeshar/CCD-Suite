import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/hr/stats
 * Dashboard statistics for the HR module.
 */
export async function GET(_request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'hr:stats' });
  if (limited) return limitResp!;

  const [
    activeEmployeesRes,
    onLeaveRes,
    pendingLeaveRes,
    lastPayrollRes,
    headcountRes,
    deptDistributionRes,
  ] = await Promise.all([
    // Count active employees
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),

    // Count on-leave employees
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'on_leave'),

    // Count pending leave requests
    supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    // Last completed payroll total
    supabase
      .from('payroll_runs')
      .select('total_net, currency')
      .eq('status', 'completed')
      .order('period_end', { ascending: false })
      .limit(1),

    // Total headcount
    supabase
      .from('employees')
      .select('id', { count: 'exact', head: true }),

    // Department distribution (active employees with department)
    supabase
      .from('employees')
      .select('department_id, department:departments!department_id(name)')
      .eq('status', 'active'),
  ]);

  if (activeEmployeesRes.error) return dbError(activeEmployeesRes.error, 'Failed to fetch stats');
  if (onLeaveRes.error) return dbError(onLeaveRes.error, 'Failed to fetch stats');
  if (pendingLeaveRes.error) return dbError(pendingLeaveRes.error, 'Failed to fetch stats');
  if (lastPayrollRes.error) return dbError(lastPayrollRes.error, 'Failed to fetch stats');
  if (headcountRes.error) return dbError(headcountRes.error, 'Failed to fetch stats');
  if (deptDistributionRes.error) return dbError(deptDistributionRes.error, 'Failed to fetch stats');

  // Aggregate department distribution
  const deptCounts = new Map<string, number>();
  for (const row of deptDistributionRes.data ?? []) {
    const dept = row.department as unknown as { name: string } | null;
    const name = dept?.name ?? 'Unassigned';
    deptCounts.set(name, (deptCounts.get(name) ?? 0) + 1);
  }
  const department_distribution = Array.from(deptCounts.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const lastPayroll = lastPayrollRes.data?.[0];

  return NextResponse.json({
    success: true,
    data: {
      active_employees: activeEmployeesRes.count ?? 0,
      on_leave: onLeaveRes.count ?? 0,
      pending_leave_requests: pendingLeaveRes.count ?? 0,
      total_headcount: headcountRes.count ?? 0,
      last_payroll_total: lastPayroll?.total_net ?? 0,
      last_payroll_currency: lastPayroll?.currency ?? 'USD',
      department_distribution,
    },
  });
}
