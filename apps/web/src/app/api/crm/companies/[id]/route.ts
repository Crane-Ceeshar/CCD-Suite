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
  const uuidError = validateUuid(id, 'Company');
  if (uuidError) return uuidError;

  const { data, error: queryError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Company');

  return success(data);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Company');
  if (uuidError) return uuidError;

  const body = sanitizeObject(await request.json());

  const { data, error: updateError } = await supabase
    .from('companies')
    .update({
      ...(body.name !== undefined && { name: body.name }),
      ...(body.industry !== undefined && { industry: body.industry }),
      ...(body.website !== undefined && { website: body.website }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.city !== undefined && { city: body.city }),
      ...(body.state !== undefined && { state: body.state }),
      ...(body.country !== undefined && { country: body.country }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.notes !== undefined && { notes: body.notes }),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) return dbError(updateError, 'Company');

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Company');
  if (uuidError) return uuidError;

  const { data: deleted, error: deleteError } = await supabase
    .from('companies')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (deleteError) return dbError(deleteError, 'Company');

  return success(deleted);
}
