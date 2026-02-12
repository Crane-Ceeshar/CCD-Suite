import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateContractTemplateSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:templates:get' });
  if (limited) return limitResp!;

  const { data: template, error: queryError } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) return dbError(queryError, 'Template not found');

  return success(template);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:templates:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateContractTemplateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.content !== undefined) updateFields.content = body.content;
  if (body.variables !== undefined) updateFields.variables = body.variables;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  const { data: template, error: updateError } = await supabase
    .from('contract_templates')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) return dbError(updateError, 'Template not found');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract_template.updated',
    resource_type: 'contract_template',
    resource_id: id,
    details: body,
  });

  return success(template);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:templates:delete' });
  if (limited) return limitResp!;

  const { error: deleteError } = await supabase
    .from('contract_templates')
    .delete()
    .eq('id', id);

  if (deleteError) return dbError(deleteError, 'Failed to delete template');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract_template.deleted',
    resource_type: 'contract_template',
    resource_id: id,
  });

  return success({ deleted: true });
}
