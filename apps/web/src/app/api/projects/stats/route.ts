import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/stats
 * Aggregate stats: active projects, open tasks, hours tracked, overdue tasks.
 */
export async function GET() {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'projects:stats' });
  if (limited) return limitResp!;

  // Run all counts in parallel
  const [projectsRes, openTasksRes, hoursRes, overdueRes] = await Promise.all([
    supabase
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['todo', 'in_progress', 'review']),
    supabase
      .from('time_entries')
      .select('duration_minutes'),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['todo', 'in_progress', 'review'])
      .lt('due_date', new Date().toISOString().split('T')[0]),
  ]);

  if (projectsRes.error) return dbError(projectsRes.error, 'Failed to fetch stats');

  const totalMinutes = (hoursRes.data ?? []).reduce(
    (sum, e) => sum + (e.duration_minutes ?? 0),
    0
  );
  const totalHours = Math.round(totalMinutes / 60);

  return success({
    active_projects: projectsRes.count ?? 0,
    open_tasks: openTasksRes.count ?? 0,
    hours_tracked: totalHours,
    overdue_tasks: overdueRes.count ?? 0,
  });
}
