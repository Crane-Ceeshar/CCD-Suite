import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/projects/:id/time-entries/running
 * Get the currently running timer for the authenticated user in this project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Get tasks for this project (id + title for enrichment)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('project_id', id);

  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);
  const taskMap = new Map((tasks ?? []).map((t: { id: string; title: string }) => [t.id, t]));

  if (taskIds.length === 0) {
    return success(null);
  }

  const { data, error: fetchError } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_running', true)
    .in('task_id', taskIds)
    .maybeSingle();

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch running timer');
  }

  if (!data) return success(null);

  // Enrich with task info
  const task = taskMap.get(data.task_id);
  const enriched = {
    ...data,
    task: task ? { id: task.id, title: task.title, project_id: id } : undefined,
  };

  return success(enriched);
}
