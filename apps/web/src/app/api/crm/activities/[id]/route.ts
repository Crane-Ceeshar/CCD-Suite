import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { validateBody } from '@/lib/api/validate';
import { updateActivitySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:activities:update' });
  if (limited) return limitResp!;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Activity');
  if (uuidError) return uuidError;

  const { data: rawBody, error: bodyError } = await validateBody(request, updateActivitySchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.type !== undefined) updateFields.type = body.type;
  if (body.scheduled_at !== undefined) updateFields.scheduled_at = body.scheduled_at;
  if (body.is_completed !== undefined) {
    updateFields.is_completed = body.is_completed;
    updateFields.completed_at = body.is_completed ? new Date().toISOString() : null;
  }

  const { data, error: updateError } = await supabase
    .from('activities')
    .update(updateFields)
    .eq('id', id)
    .select(
      '*, deal:deals(id, title), contact:contacts(id, first_name, last_name), company:companies(id, name)'
    )
    .single();

  if (updateError) return dbError(updateError, 'Activity');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'activity.updated',
    resource_type: 'activity',
    resource_id: id,
  });

  return success(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'crm:activities:delete' });
  if (limited) return limitResp!;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Activity');
  if (uuidError) return uuidError;

  const { data: deleted, error: deleteError } = await supabase
    .from('activities')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (deleteError) return dbError(deleteError, 'Activity');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'activity.deleted',
    resource_type: 'activity',
    resource_id: id,
  });

  return success(deleted);
}
