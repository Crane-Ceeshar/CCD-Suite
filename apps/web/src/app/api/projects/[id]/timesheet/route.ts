import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { timesheetQuerySchema } from '@/lib/api/schemas/projects';

/**
 * GET /api/projects/:id/timesheet
 * Timesheet report: grouped by date, user, or task.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: query, error: queryError } = validateQuery(request.nextUrl.searchParams, timesheetQuerySchema);
  if (queryError) return queryError;

  // Get task ids for this project
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('project_id', id);

  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);
  const taskMap = new Map((tasks ?? []).map((t: { id: string; title: string }) => [t.id, t.title]));

  if (taskIds.length === 0) {
    return success({
      rows: [],
      total_minutes: 0,
      billable_minutes: 0,
      total_cost: 0,
    });
  }

  let q = supabase
    .from('time_entries')
    .select('*')
    .in('task_id', taskIds)
    .gte('started_at', query.from)
    .lte('started_at', query.to)
    .eq('is_running', false)
    .order('started_at', { ascending: true });

  if (query.user_id) q = q.eq('user_id', query.user_id);

  const { data: entries, error: fetchError } = await q;

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch timesheet data');
  }

  // Build grouped data
  interface Entry {
    task_id: string;
    user_id: string;
    started_at: string;
    duration_minutes: number | null;
    billable: boolean;
    hourly_rate: number | null;
    profile?: { id: string; full_name: string | null };
  }

  const typedEntries = (entries ?? []) as Entry[];

  let totalMinutes = 0;
  let billableMinutes = 0;
  let totalCost = 0;

  if (query.group_by === 'task') {
    // Group by task
    const taskGroups: Record<string, { task_id: string; task_title: string; entries: Record<string, number>; total_minutes: number; billable_minutes: number }> = {};

    for (const entry of typedEntries) {
      const mins = entry.duration_minutes ?? 0;
      const dateKey = new Date(entry.started_at).toISOString().slice(0, 10);
      totalMinutes += mins;
      if (entry.billable) {
        billableMinutes += mins;
        totalCost += (mins / 60) * (entry.hourly_rate ?? 0);
      }

      if (!taskGroups[entry.task_id]) {
        taskGroups[entry.task_id] = {
          task_id: entry.task_id,
          task_title: taskMap.get(entry.task_id) ?? 'Unknown',
          entries: {},
          total_minutes: 0,
          billable_minutes: 0,
        };
      }
      const g = taskGroups[entry.task_id];
      g.entries[dateKey] = (g.entries[dateKey] ?? 0) + mins;
      g.total_minutes += mins;
      if (entry.billable) g.billable_minutes += mins;
    }

    return success({
      rows: Object.values(taskGroups),
      total_minutes: totalMinutes,
      billable_minutes: billableMinutes,
      total_cost: Math.round(totalCost * 100) / 100,
    });
  }

  if (query.group_by === 'user') {
    // Group by user
    const userGroups: Record<string, { user_id: string; user_name: string; entries: Record<string, number>; total_minutes: number; billable_minutes: number }> = {};

    for (const entry of typedEntries) {
      const mins = entry.duration_minutes ?? 0;
      const dateKey = new Date(entry.started_at).toISOString().slice(0, 10);
      totalMinutes += mins;
      if (entry.billable) {
        billableMinutes += mins;
        totalCost += (mins / 60) * (entry.hourly_rate ?? 0);
      }

      if (!userGroups[entry.user_id]) {
        userGroups[entry.user_id] = {
          user_id: entry.user_id,
          user_name: entry.profile?.full_name ?? 'Unknown',
          entries: {},
          total_minutes: 0,
          billable_minutes: 0,
        };
      }
      const g = userGroups[entry.user_id];
      g.entries[dateKey] = (g.entries[dateKey] ?? 0) + mins;
      g.total_minutes += mins;
      if (entry.billable) g.billable_minutes += mins;
    }

    return success({
      rows: Object.values(userGroups),
      total_minutes: totalMinutes,
      billable_minutes: billableMinutes,
      total_cost: Math.round(totalCost * 100) / 100,
    });
  }

  // Default: group by date
  const dateGroups: Record<string, { date: string; total_minutes: number; billable_minutes: number; entry_count: number }> = {};

  for (const entry of typedEntries) {
    const mins = entry.duration_minutes ?? 0;
    const dateKey = new Date(entry.started_at).toISOString().slice(0, 10);
    totalMinutes += mins;
    if (entry.billable) {
      billableMinutes += mins;
      totalCost += (mins / 60) * (entry.hourly_rate ?? 0);
    }

    if (!dateGroups[dateKey]) {
      dateGroups[dateKey] = { date: dateKey, total_minutes: 0, billable_minutes: 0, entry_count: 0 };
    }
    dateGroups[dateKey].total_minutes += mins;
    if (entry.billable) dateGroups[dateKey].billable_minutes += mins;
    dateGroups[dateKey].entry_count += 1;
  }

  return success({
    rows: Object.values(dateGroups).sort((a, b) => a.date.localeCompare(b.date)),
    total_minutes: totalMinutes,
    billable_minutes: billableMinutes,
    total_cost: Math.round(totalCost * 100) / 100,
  });
}
