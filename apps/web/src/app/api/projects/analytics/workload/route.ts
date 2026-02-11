import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/analytics/workload
 * Team workload distribution — tasks, hours, and story points per member.
 */
export async function GET() {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'projects:analytics:workload' });
  if (limited) return limitResp!;

  // Get all distinct project members with their profile info
  const { data: members, error: membersError } = await supabase
    .from('project_members')
    .select('user_id, profile:profiles(id, full_name, avatar_url)');

  if (membersError) {
    return dbError(membersError, 'Failed to fetch team members');
  }

  // Deduplicate members (a user can be in multiple projects)
  const memberMap = new Map<string, { user_id: string; full_name: string | null; avatar_url: string | null }>();
  for (const m of members ?? []) {
    const profile = m.profile as unknown as { id: string; full_name: string | null; avatar_url: string | null } | null;
    if (profile && !memberMap.has(m.user_id)) {
      memberMap.set(m.user_id, {
        user_id: m.user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      });
    }
  }

  const userIds = Array.from(memberMap.keys());

  if (userIds.length === 0) {
    return success([]);
  }

  // Calculate Monday of current week (ISO week: Monday = 1)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const mondayIso = monday.toISOString();

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  const sundayIso = sunday.toISOString();

  // Fetch tasks and time entries in parallel
  const [tasksRes, weekEntriesRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, assigned_to, status, story_points')
      .in('assigned_to', userIds),
    supabase
      .from('time_entries')
      .select('user_id, duration_minutes')
      .in('user_id', userIds)
      .gte('started_at', mondayIso)
      .lte('started_at', sundayIso)
      .eq('is_running', false),
  ]);

  const allTasks = tasksRes.data ?? [];
  const weekEntries = weekEntriesRes.data ?? [];

  // Build per-member stats
  const result = userIds.map((uid) => {
    const info = memberMap.get(uid)!;
    const userTasks = allTasks.filter((t: { assigned_to: string | null }) => t.assigned_to === uid);

    const assignedTasks = userTasks.filter(
      (t: { status: string }) => !['done', 'cancelled'].includes(t.status)
    ).length;

    const completedTasks = userTasks.filter(
      (t: { status: string }) => t.status === 'done'
    ).length;

    const totalPoints = userTasks.reduce(
      (sum: number, t: { story_points: number | null }) => sum + (t.story_points ?? 0),
      0
    );

    const weekMinutes = weekEntries
      .filter((e: { user_id: string }) => e.user_id === uid)
      .reduce((sum: number, e: { duration_minutes: number | null }) => sum + (e.duration_minutes ?? 0), 0);

    return {
      user_id: uid,
      full_name: info.full_name,
      avatar_url: info.avatar_url,
      assigned_tasks: assignedTasks,
      completed_tasks: completedTasks,
      hours_this_week: Math.round((weekMinutes / 60) * 100) / 100,
      total_points: totalPoints,
    };
  });

  return success(result);
}
