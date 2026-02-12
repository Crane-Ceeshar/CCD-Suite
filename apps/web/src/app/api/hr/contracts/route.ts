import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createContractSchema, contractListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:contracts:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(request.nextUrl.searchParams, contractListQuerySchema);
  if (queryValidationError) return queryValidationError;

  const { employee_id, status, type, search, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('contracts')
    .select('*, employee:employees!employee_id(id, first_name, last_name, email), template:contract_templates(id, name)', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (employee_id) dbQuery = dbQuery.eq('employee_id', employee_id);
  if (status) dbQuery = dbQuery.eq('status', status);
  if (type) dbQuery = dbQuery.eq('type', type);
  if (search) dbQuery = dbQuery.ilike('title', `%${search}%`);

  const { data, error: queryError, count } = await dbQuery;
  if (queryError) return dbError(queryError, 'Failed to fetch contracts');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:contracts:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createContractSchema);
  if (bodyError) return bodyError;

  // If template_id provided, fetch template content
  let content = body.content ?? [];
  if (body.template_id) {
    const { data: template } = await supabase
      .from('contract_templates')
      .select('content, variables')
      .eq('id', body.template_id)
      .single();
    if (template) {
      content = template.content;
    }
  }

  const { data: contract, error: insertError } = await supabase
    .from('contracts')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      template_id: body.template_id ?? null,
      title: body.title,
      type: body.type ?? 'employment',
      content,
      file_url: body.file_url ?? null,
      status: 'draft',
      expires_at: body.expires_at ?? null,
      created_by: user.id,
    })
    .select('*, employee:employees!employee_id(id, first_name, last_name, email)')
    .single();

  if (insertError) return dbError(insertError, 'Failed to create contract');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract.created',
    resource_type: 'contract',
    resource_id: contract.id,
    details: { employee_id: body.employee_id, title: body.title },
  });

  return success(contract, 201);
}
