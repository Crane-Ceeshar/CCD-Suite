import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Activity');
  if (uuidError) return uuidError;

  const body = sanitizeObject(await request.json());

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

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

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

  return success(deleted);
}
