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
  const uuidError = validateUuid(id, 'Product');
  if (uuidError) return uuidError;

  const body = sanitizeObject(await request.json());

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.sku !== undefined) updateFields.sku = body.sku;
  if (body.price !== undefined) updateFields.price = body.price;
  if (body.currency !== undefined) updateFields.currency = body.currency;
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  const { data, error: updateError } = await supabase
    .from('products')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return dbError(updateError, 'Product');

  return success(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Product');
  if (uuidError) return uuidError;

  const { data: deleted, error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (deleteError) return dbError(deleteError, 'Product');

  return success(deleted);
}
