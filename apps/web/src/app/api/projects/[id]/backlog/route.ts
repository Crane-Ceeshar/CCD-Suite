import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { bulkAssignSprintSchema } from '@/lib/api/schemas/projects';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/:id/backlog
 * Get backlog: tasks where sprint_id IS NULL, ordered by priority/position.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', id)
    .is('sprint_id', null)
    .is('parent_id', null)
    .order('position', { ascending: true });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch backlog');
  }

  return success(data);
}

/**
 * PATCH /api/projects/:id/backlog
 * Bulk assign tasks to a sprint (or move back to backlog with sprint_id=null).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'backlog:assign' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, bulkAssignSprintSchema);
  if (bodyError) return bodyError;

  // Update all tasks
  const results = await Promise.all(
    body.task_ids.map((taskId) =>
      supabase
        .from('tasks')
        .update({ sprint_id: body.sprint_id })
        .eq('id', taskId)
        .eq('project_id', id)
    )
  );

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return errorResponse(`Failed to update ${errors.length} task(s)`, 500);
  }

  return success({ updated: body.task_ids.length });
}
