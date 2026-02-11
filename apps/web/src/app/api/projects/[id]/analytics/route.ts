import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/:id/analytics
 * Single project analytics dashboard — tasks, time, budget, team.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'projects:analytics' });
  if (limited) return limitResp!;

  const { id } = await params;

  // Fetch task IDs first (time_entries has task_id, not project_id)
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, status, priority, story_points, due_date, created_at, updated_at')
    .eq('project_id', id);

  if (tasksError) {
    return dbError(tasksError, 'Failed to fetch tasks');
  }

  const allTasks = tasks ?? [];
  const taskIds = allTasks.map((t: { id: string }) => t.id);

  // Run remaining queries in parallel
  const [timeEntriesRes, projectRes, membersRes] = await Promise.all([
    taskIds.length > 0
      ? supabase
          .from('time_entries')
          .select('duration_minutes, billable, hourly_rate')
          .in('task_id', taskIds)
          .eq('is_running', false)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('projects')
      .select('budget')
      .eq('id', id)
      .single(),
    supabase
      .from('project_members')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id),
  ]);

  if (projectRes.error) {
    return dbError(projectRes.error, 'Project');
  }

  // --- Task metrics ---
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter((t: { status: string }) => t.status === 'done').length;
  const taskCompletionRate = totalTasks > 0
    ? Math.round((doneTasks / totalTasks) * 10000) / 100
    : 0;

  // Average duration (days) for done tasks: updated_at - created_at
  const doneDurations = allTasks
    .filter((t: { status: string }) => t.status === 'done')
    .map((t: { created_at: string; updated_at: string }) => {
      const created = new Date(t.created_at).getTime();
      const completed = new Date(t.updated_at).getTime();
      return (completed - created) / (1000 * 60 * 60 * 24);
    });

  const avgTaskDurationDays = doneDurations.length > 0
    ? Math.round((doneDurations.reduce((a, b) => a + b, 0) / doneDurations.length) * 100) / 100
    : 0;

  const today = new Date().toISOString().split('T')[0];
  const overdueCount = allTasks.filter(
    (t: { due_date: string | null; status: string }) =>
      t.due_date && t.due_date < today && !['done', 'cancelled'].includes(t.status)
  ).length;

  // Tasks by status
  const tasksByStatus: Record<string, number> = {};
  for (const t of allTasks) {
    const s = (t as { status: string }).status;
    tasksByStatus[s] = (tasksByStatus[s] ?? 0) + 1;
  }

  // Tasks by priority
  const tasksByPriority: Record<string, number> = {};
  for (const t of allTasks) {
    const p = (t as { priority: string }).priority ?? 'none';
    tasksByPriority[p] = (tasksByPriority[p] ?? 0) + 1;
  }

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
  const budget = projectRes.data?.budget ?? 0;
  const budgetBurnPct = budget > 0
    ? Math.round((totalCost / budget) * 10000) / 100
    : 0;

  return success({
    task_completion_rate: taskCompletionRate,
    avg_task_duration_days: avgTaskDurationDays,
    overdue_count: overdueCount,
    total_tasks: totalTasks,
    tasks_by_status: tasksByStatus,
    tasks_by_priority: tasksByPriority,
    total_hours: totalHours,
    billable_hours: billableHours,
    total_cost: totalCost,
    budget,
    budget_burn_pct: budgetBurnPct,
    member_count: membersRes.count ?? 0,
  });
}
