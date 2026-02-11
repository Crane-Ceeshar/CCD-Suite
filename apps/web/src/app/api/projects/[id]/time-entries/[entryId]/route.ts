import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateTimeEntrySchema } from '@/lib/api/schemas/projects';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * PATCH /api/projects/:id/time-entries/:entryId
 * Update a time entry. Stop timer (set ended_at, calculate duration).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, entryId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 200, keyPrefix: 'time-entries:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateTimeEntrySchema);
  if (bodyError) return bodyError;

  // Fetch existing entry
  const { data: existing, error: fetchError } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .single();

  if (fetchError || !existing) {
    return errorResponse('Time entry not found', 404);
  }

  // Verify task belongs to this project and get title for enrichment
  const { data: entryTask } = await supabase
    .from('tasks')
    .select('id, title, project_id')
    .eq('id', existing.task_id)
    .single();

  if (entryTask?.project_id !== id) {
    return errorResponse('Time entry does not belong to this project', 403);
  }

  const updateFields: Record<string, unknown> = {};
  const allowedFields = ['description', 'ended_at', 'duration_minutes', 'is_running', 'billable', 'hourly_rate'] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  // If stopping a timer: set ended_at and calculate duration
  if (body.is_running === false && existing.is_running) {
    const now = new Date();
    if (!updateFields.ended_at) {
      updateFields.ended_at = now.toISOString();
    }
    const start = new Date(existing.started_at).getTime();
    const end = new Date(updateFields.ended_at as string).getTime();
    updateFields.duration_minutes = Math.round((end - start) / 60000);
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('time_entries')
    .update(updateFields)
    .eq('id', entryId)
    .select('*')
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to update time entry');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'time_entry.updated',
    resource_type: 'time_entry',
    resource_id: entryId,
    details: { fields: Object.keys(updateFields), project_id: id },
  });

  // Enrich response with task and profile info
  const enriched = {
    ...data,
    task: entryTask ? { id: entryTask.id, title: (entryTask as { id: string; title: string }).title, project_id: id } : undefined,
    profile: { id: user.id, full_name: profile.full_name ?? null, avatar_url: null },
  };

  return success(enriched);
}

/**
 * DELETE /api/projects/:id/time-entries/:entryId
 * Delete a time entry.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, entryId } = await params;

  const { error: deleteError } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete time entry');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'time_entry.deleted',
    resource_type: 'time_entry',
    resource_id: entryId,
    details: { project_id: id },
  });

  return success({ deleted: true });
}
