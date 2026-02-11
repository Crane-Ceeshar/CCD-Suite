import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

const createDependencySchema = z.object({
  depends_on_task_id: z.string().uuid(),
  dependency_type: z.enum(['blocks', 'blocked_by', 'relates_to']).default('blocks'),
});

/**
 * GET /api/projects/:id/tasks/:taskId/dependencies
 * List dependencies for a task, with joined task info for both ends.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { taskId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'task-deps:list' });
  if (limited) return limitResp!;

  // Get dependencies where this task is the source
  const { data: outgoing, error: outError } = await supabase
    .from('task_dependencies')
    .select('id, task_id, depends_on_task_id, dependency_type, created_at')
    .eq('task_id', taskId);

  if (outError) {
    return dbError(outError, 'Failed to fetch task dependencies');
  }

  // Get dependencies where this task is the target
  const { data: incoming, error: inError } = await supabase
    .from('task_dependencies')
    .select('id, task_id, depends_on_task_id, dependency_type, created_at')
    .eq('depends_on_task_id', taskId);

  if (inError) {
    return dbError(inError, 'Failed to fetch task dependencies');
  }

  return success({
    outgoing: outgoing ?? [],
    incoming: incoming ?? [],
  });
}

/**
 * POST /api/projects/:id/tasks/:taskId/dependencies
 * Create a task dependency.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id: projectId, taskId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'task-deps:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createDependencySchema);
  if (bodyError) return bodyError;

  // Prevent self-reference
  if (taskId === body.depends_on_task_id) {
    return error('A task cannot depend on itself', 400);
  }

  // Verify the depends_on task exists
  const { data: targetTask, error: targetError } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('id', body.depends_on_task_id)
    .maybeSingle();

  if (targetError) {
    return dbError(targetError, 'Failed to verify target task');
  }

  if (!targetTask) {
    return notFound('Target task');
  }

  const { data, error: insertError } = await supabase
    .from('task_dependencies')
    .insert({
      task_id: taskId,
      depends_on_task_id: body.depends_on_task_id,
      dependency_type: body.dependency_type,
    })
    .select('id, task_id, depends_on_task_id, dependency_type, created_at')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create task dependency');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'task_dependency.created',
    resource_type: 'task_dependency',
    resource_id: data.id,
    details: {
      project_id: projectId,
      task_id: taskId,
      depends_on_task_id: body.depends_on_task_id,
      dependency_type: body.dependency_type,
    },
  });

  return success(data, 201);
}

/**
 * DELETE /api/projects/:id/tasks/:taskId/dependencies?dependencyId=UUID
 * Delete a task dependency.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id: projectId, taskId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'task-deps:delete' });
  if (limited) return limitResp!;

  const dependencyId = request.nextUrl.searchParams.get('dependencyId');
  if (!dependencyId) {
    return error('dependencyId query parameter is required', 400);
  }

  // Verify the dependency exists and belongs to this task
  const { data: existing, error: fetchError } = await supabase
    .from('task_dependencies')
    .select('id, task_id, depends_on_task_id, dependency_type')
    .eq('id', dependencyId)
    .maybeSingle();

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch task dependency');
  }

  if (!existing) {
    return notFound('Task dependency');
  }

  // Ensure the dependency is related to this task (either direction)
  if (existing.task_id !== taskId && existing.depends_on_task_id !== taskId) {
    return notFound('Task dependency');
  }

  const { error: deleteError } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('id', dependencyId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete task dependency');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'task_dependency.deleted',
    resource_type: 'task_dependency',
    resource_id: dependencyId,
    details: {
      project_id: projectId,
      task_id: existing.task_id,
      depends_on_task_id: existing.depends_on_task_id,
      dependency_type: existing.dependency_type,
    },
  });

  return success({ deleted: true });
}
