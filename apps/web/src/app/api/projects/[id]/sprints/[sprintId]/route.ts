import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateSprintSchema } from '@/lib/api/schemas/projects';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/:id/sprints/:sprintId
 * Get sprint with its tasks.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id, sprintId } = await params;

  const [sprintRes, tasksRes] = await Promise.all([
    supabase.from('sprints').select('*').eq('id', sprintId).eq('project_id', id).single(),
    supabase.from('tasks').select('*')
      .eq('sprint_id', sprintId).order('position', { ascending: true }),
  ]);

  if (sprintRes.error) {
    return dbError(sprintRes.error, 'Sprint');
  }

  return success({
    ...sprintRes.data,
    tasks: tasksRes.data ?? [],
  });
}

/**
 * PATCH /api/projects/:id/sprints/:sprintId
 * Update sprint (start, complete, update goal/dates).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, sprintId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'sprints:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateSprintSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  const allowedFields = ['name', 'goal', 'status', 'start_date', 'end_date', 'capacity_points'] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('sprints')
    .update(updateFields)
    .eq('id', sprintId)
    .eq('project_id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Sprint');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'sprint.updated',
    resource_type: 'sprint',
    resource_id: sprintId,
    details: { name: data.name, fields: Object.keys(updateFields), project_id: id },
  });

  return success(data);
}

/**
 * DELETE /api/projects/:id/sprints/:sprintId
 * Delete sprint. Moves tasks back to backlog (sprint_id=null).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; sprintId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, sprintId } = await params;

  // Move tasks back to backlog
  await supabase
    .from('tasks')
    .update({ sprint_id: null })
    .eq('sprint_id', sprintId);

  const { data: sprint, error: fetchError } = await supabase
    .from('sprints')
    .select('id, name')
    .eq('id', sprintId)
    .eq('project_id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Sprint');
  }

  const { error: deleteError } = await supabase
    .from('sprints')
    .delete()
    .eq('id', sprintId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete sprint');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'sprint.deleted',
    resource_type: 'sprint',
    resource_id: sprintId,
    details: { name: sprint.name, project_id: id },
  });

  return success({ deleted: true });
}
