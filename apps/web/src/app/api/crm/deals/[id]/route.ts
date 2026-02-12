import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Deal');
  if (uuidError) return uuidError;

  const { data, error: queryError } = await supabase
    .from('deals')
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)'
    )
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Deal');

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Deal');
  if (uuidError) return uuidError;

  const body = sanitizeObject(await request.json());

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.value !== undefined) updateFields.value = body.value;
  if (body.currency !== undefined) updateFields.currency = body.currency;
  if (body.stage_id !== undefined) updateFields.stage_id = body.stage_id;
  if (body.pipeline_id !== undefined) updateFields.pipeline_id = body.pipeline_id;
  if (body.company_id !== undefined) updateFields.company_id = body.company_id;
  if (body.contact_id !== undefined) updateFields.contact_id = body.contact_id;
  if (body.status !== undefined) {
    updateFields.status = body.status;
    if (body.status === 'won' || body.status === 'lost') {
      updateFields.actual_close_date = new Date().toISOString();
    }
  }
  if (body.expected_close_date !== undefined) updateFields.expected_close_date = body.expected_close_date;
  if (body.notes !== undefined) updateFields.notes = body.notes;
  if (body.position !== undefined) updateFields.position = body.position;
  if (body.assigned_to !== undefined) updateFields.assigned_to = body.assigned_to;

  const { data, error: updateError } = await supabase
    .from('deals')
    .update(updateFields)
    .eq('id', id)
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)'
    )
    .single();

  if (updateError) return dbError(updateError, 'Deal');

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Deal');
  if (uuidError) return uuidError;

  const { data: deleted, error: deleteError } = await supabase
    .from('deals')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (deleteError) return dbError(deleteError, 'Deal');

  return success(deleted);
}
