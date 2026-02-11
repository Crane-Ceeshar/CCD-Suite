import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateTaskSchema } from '@/lib/api/schemas/projects';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/:id/tasks/:taskId
 * Get a single task with subtasks.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id: projectId, taskId } = await params;

  const { data, error: queryError } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('project_id', projectId)
    .single();

  if (queryError) {
    return dbError(queryError, 'Task');
  }

  // Fetch subtasks
  const { data: subtasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('parent_id', taskId)
    .order('position', { ascending: true });

  return success({ ...data, subtasks: subtasks ?? [] });
}

/**
 * PATCH /api/projects/:id/tasks/:taskId
 * Update a task.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id: projectId, taskId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'tasks:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateTaskSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'title', 'description', 'status', 'priority', 'due_date', 'start_date',
    'estimated_hours', 'assigned_to', 'parent_id', 'labels', 'position',
    'story_points', 'sprint_id', 'metadata',
  ] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('tasks')
    .update(updateFields)
    .eq('id', taskId)
    .eq('project_id', projectId)
    .select('*')
    .single();

  if (updateError) {
    return dbError(updateError, 'Task');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'task.updated',
    resource_type: 'task',
    resource_id: taskId,
    details: { title: data.title, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/projects/:id/tasks/:taskId
 * Delete a task and its subtasks.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id: projectId, taskId } = await params;

  // Fetch task for audit log
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('id', taskId)
    .eq('project_id', projectId)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Task');
  }

  // Delete subtask time entries, then subtasks
  const { data: subtasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('parent_id', taskId);

  if (subtasks && subtasks.length > 0) {
    const subtaskIds = subtasks.map((s: { id: string }) => s.id);
    await supabase.from('time_entries').delete().in('task_id', subtaskIds);
    await supabase.from('tasks').delete().in('id', subtaskIds);
  }

  // Delete time entries for this task, then the task
  await supabase.from('time_entries').delete().eq('task_id', taskId);

  const { error: deleteError } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('project_id', projectId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete task');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'task.deleted',
    resource_type: 'task',
    resource_id: taskId,
    details: { title: task.title, project_id: projectId },
  });

  return success({ deleted: true });
}
