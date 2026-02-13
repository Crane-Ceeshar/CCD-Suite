import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { validateBody } from '@/lib/api/validate';
import { updateProductSchema } from '@/lib/api/schemas/crm';
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

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:products:update' });
  if (limited) return limitResp!;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Product');
  if (uuidError) return uuidError;

  const { data: rawBody, error: bodyError } = await validateBody(request, updateProductSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

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

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'product.updated',
    resource_type: 'product',
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

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'crm:products:delete' });
  if (limited) return limitResp!;

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

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'product.deleted',
    resource_type: 'product',
    resource_id: id,
  });

  return success(deleted);
}
