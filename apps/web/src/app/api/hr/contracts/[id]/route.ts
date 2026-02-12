import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateContractSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:contracts:get' });
  if (limited) return limitResp!;

  const { data: contract, error: queryError } = await supabase
    .from('contracts')
    .select('*, employee:employees!employee_id(id, first_name, last_name, email, job_title), template:contract_templates(id, name), signatures:document_signatures(id, signature_method, typed_name, signed_at, signer:employees!signer_employee_id(id, first_name, last_name))')
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Contract not found');

  return success(contract);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:contracts:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateContractSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.type !== undefined) updateFields.type = body.type;
  if (body.content !== undefined) updateFields.content = body.content;
  if (body.file_url !== undefined) updateFields.file_url = body.file_url;
  if (body.status !== undefined) updateFields.status = body.status;
  if (body.expires_at !== undefined) updateFields.expires_at = body.expires_at;

  const { data: contract, error: updateError } = await supabase
    .from('contracts')
    .update(updateFields)
    .eq('id', id)
    .select('*, employee:employees!employee_id(id, first_name, last_name, email)')
    .single();

  if (updateError) return dbError(updateError, 'Contract not found');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract.updated',
    resource_type: 'contract',
    resource_id: id,
    details: body,
  });

  return success(contract);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:contracts:delete' });
  if (limited) return limitResp!;

  const { data: contract, error: deleteError } = await supabase
    .from('contracts')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .single();

  if (deleteError) return dbError(deleteError, 'Contract not found');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract.cancelled',
    resource_type: 'contract',
    resource_id: id,
  });

  return success(contract);
}
