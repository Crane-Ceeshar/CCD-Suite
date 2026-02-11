import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/projects/:id/sprints/:sprintId/burndown
 * Burndown data: daily remaining points from sprint start to today.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id, sprintId } = await params;

  // Get sprint
  const { data: sprint, error: sprintError } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', sprintId)
    .eq('project_id', id)
    .single();

  if (sprintError) {
    return dbError(sprintError, 'Sprint');
  }

  // Get tasks in this sprint with their story points
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, story_points, status, updated_at')
    .eq('sprint_id', sprintId);

  const sprintTasks = tasks ?? [];
  const totalPoints = sprintTasks.reduce((sum, t: { story_points: number | null }) => sum + (t.story_points ?? 0), 0);

  if (!sprint.start_date || !sprint.end_date || totalPoints === 0) {
    return success([]);
  }

  const startDate = new Date(sprint.start_date);
  const endDate = new Date(sprint.end_date);
  const today = new Date();
  const effectiveEnd = today < endDate ? today : endDate;

  // Calculate ideal burndown line
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const pointsPerDay = totalPoints / totalDays;

  // Build daily burndown data
  const burndownData: { date: string; remaining_points: number; ideal_points: number }[] = [];

  const completedTasks = sprintTasks.filter((t: { status: string }) => t.status === 'done');

  const current = new Date(startDate);
  let dayIndex = 0;

  while (current <= effectiveEnd) {
    const dateStr = current.toISOString().slice(0, 10);

    // Count points completed by this date
    const completedByDate = completedTasks
      .filter((t: { updated_at: string }) => new Date(t.updated_at).toISOString().slice(0, 10) <= dateStr)
      .reduce((sum: number, t: { story_points: number | null }) => sum + (t.story_points ?? 0), 0);

    burndownData.push({
      date: dateStr,
      remaining_points: totalPoints - completedByDate,
      ideal_points: Math.max(0, totalPoints - pointsPerDay * dayIndex),
    });

    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  return success(burndownData);
}
