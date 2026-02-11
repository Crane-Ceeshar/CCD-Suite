import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError, notFound } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateProjectSchema } from '@/lib/api/schemas/projects';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/:id
 * Get a single project with members and task counts.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const [projectRes, membersRes, totalRes, completedRes] = await Promise.all([
    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('project_members')
      .select('id, user_id, role, profile:profiles(id, full_name, email, avatar_url)')
      .eq('project_id', id),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'done'),
  ]);

  if (projectRes.error) {
    return dbError(projectRes.error, 'Project');
  }

  return success({
    ...projectRes.data,
    members: membersRes.data ?? [],
    task_count: totalRes.count ?? 0,
    completed_task_count: completedRes.count ?? 0,
  });
}

/**
 * PATCH /api/projects/:id
 * Update a project.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'projects:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateProjectSchema);
  if (bodyError) return bodyError;

  // Build update fields — only include provided fields
  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'name', 'description', 'status', 'priority', 'start_date', 'due_date',
    'budget', 'currency', 'color', 'client_id', 'metadata',
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
    .from('projects')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Project');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.updated',
    resource_type: 'project',
    resource_id: id,
    details: { name: data.name, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/projects/:id
 * Delete a project (hard delete with cascading).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Verify project exists
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Project');
  }

  // Delete related data first
  await supabase.from('time_entries').delete().eq('project_id', id);
  await supabase.from('tasks').delete().eq('project_id', id);
  await supabase.from('project_members').delete().eq('project_id', id);

  const { error: deleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete project');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.deleted',
    resource_type: 'project',
    resource_id: id,
    details: { name: project.name },
  });

  return success({ deleted: true });
}
