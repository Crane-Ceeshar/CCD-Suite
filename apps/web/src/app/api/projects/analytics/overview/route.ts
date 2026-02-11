import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/analytics/overview
 * Cross-project overview — aggregate stats across all projects.
 */
export async function GET() {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'projects:analytics:overview' });
  if (limited) return limitResp!;

  const today = new Date().toISOString().split('T')[0];

  // Run all queries in parallel
  const [
    activeProjectsRes,
    tasksRes,
    overdueRes,
    timeEntriesRes,
    budgetRes,
  ] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('tasks')
      .select('id, status, priority'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['todo', 'in_progress', 'review'])
      .lt('due_date', today),
    supabase
      .from('time_entries')
      .select('duration_minutes, billable, hourly_rate')
      .eq('is_running', false),
    supabase
      .from('projects')
      .select('budget'),
  ]);

  if (activeProjectsRes.error) {
    return dbError(activeProjectsRes.error, 'Failed to fetch project stats');
  }

  // --- Tasks by status & priority ---
  const allTasks = tasksRes.data ?? [];
  const statusCounts: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
    cancelled: 0,
  };
  const priorityCounts: Record<string, number> = {};
  for (const t of allTasks) {
    const s = (t as { status: string }).status;
    if (s in statusCounts) {
      statusCounts[s]++;
    } else {
      statusCounts[s] = 1;
    }
    const p = (t as { priority: string | null }).priority ?? 'none';
    priorityCounts[p] = (priorityCounts[p] ?? 0) + 1;
  }
  const tasksByStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  const tasksByPriority = Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }));

  // --- Time / cost metrics ---
  interface TimeEntry {
    duration_minutes: number | null;
    billable: boolean;
    hourly_rate: number | null;
  }

  const entries = (timeEntriesRes.data ?? []) as TimeEntry[];
  let totalMinutes = 0;
  let billableMinutes = 0;
  let totalCost = 0;

  for (const e of entries) {
    const mins = e.duration_minutes ?? 0;
    totalMinutes += mins;
    if (e.billable) {
      billableMinutes += mins;
      totalCost += (mins / 60) * (e.hourly_rate ?? 0);
    }
  }

  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;
  const billableHours = Math.round((billableMinutes / 60) * 100) / 100;
  totalCost = Math.round(totalCost * 100) / 100;

  // --- Budget ---
  const totalBudget = (budgetRes.data ?? []).reduce(
    (sum, p) => sum + ((p as { budget: number | null }).budget ?? 0),
    0
  );
  const budgetBurnPct = totalBudget > 0
    ? Math.round((totalCost / totalBudget) * 10000) / 100
    : 0;

  return success({
    active_projects: activeProjectsRes.count ?? 0,
    total_tasks: allTasks.length,
    tasks_by_status: tasksByStatus,
    tasks_by_priority: tasksByPriority,
    overdue_tasks: overdueRes.count ?? 0,
    total_hours: totalHours,
    billable_hours: billableHours,
    total_cost: totalCost,
    total_budget: totalBudget,
    avg_budget_burn_pct: budgetBurnPct,
  });
}
