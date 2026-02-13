import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateUuid } from '@/lib/api/security';
import { validateBody } from '@/lib/api/validate';
import { updateCompanySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:companies:get' });
  if (limited) return limitResp!;

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
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:companies:update' });
  if (limited) return limitResp!;

  const { id } = await params;
  const uuidError = validateUuid(id, 'Company');
  if (uuidError) return uuidError;

  const { data: rawBody, error: bodyError } = await validateBody(request, updateCompanySchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

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

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'company.updated',
    resource_type: 'company',
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

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'crm:companies:delete' });
  if (limited) return limitResp!;

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

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'company.deleted',
    resource_type: 'company',
    resource_id: id,
  });

  return success(deleted);
}
