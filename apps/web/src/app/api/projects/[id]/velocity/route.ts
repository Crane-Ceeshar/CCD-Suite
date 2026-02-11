import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/projects/:id/velocity
 * Last N sprints: planned vs completed points, average velocity.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Get completed sprints
  const { data: sprints, error: queryError } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', id)
    .eq('status', 'completed')
    .order('end_date', { ascending: false })
    .limit(10);

  if (queryError) {
    return dbError(queryError, 'Failed to fetch sprints');
  }

  const velocityData = await Promise.all(
    (sprints ?? []).map(async (sprint: { id: string; name: string }) => {
      const { data: tasks } = await supabase
        .from('tasks')
        .select('story_points, status')
        .eq('sprint_id', sprint.id);

      const allTasks = tasks ?? [];
      const plannedPoints = allTasks.reduce((sum: number, t: { story_points: number | null }) => sum + (t.story_points ?? 0), 0);
      const completedPoints = allTasks
        .filter((t: { status: string }) => t.status === 'done')
        .reduce((sum: number, t: { story_points: number | null }) => sum + (t.story_points ?? 0), 0);

      return {
        sprint_name: sprint.name,
        planned_points: plannedPoints,
        completed_points: completedPoints,
        carry_over: plannedPoints - completedPoints,
      };
    })
  );

  const avgVelocity = velocityData.length > 0
    ? Math.round(velocityData.reduce((sum, v) => sum + v.completed_points, 0) / velocityData.length)
    : 0;

  return success({
    sprints: velocityData.reverse(),
    average_velocity: avgVelocity,
  });
}
