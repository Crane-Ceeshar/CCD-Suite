import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createContractTemplateSchema, templateListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:templates:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(request.nextUrl.searchParams, templateListQuerySchema);
  if (queryValidationError) return queryValidationError;

  const { search, is_active, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('contract_templates')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (search) dbQuery = dbQuery.ilike('name', `%${search}%`);
  if (is_active === 'true') dbQuery = dbQuery.eq('is_active', true);
  if (is_active === 'false') dbQuery = dbQuery.eq('is_active', false);

  const { data, error: queryError, count } = await dbQuery;
  if (queryError) return dbError(queryError, 'Failed to fetch templates');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:templates:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createContractTemplateSchema);
  if (bodyError) return bodyError;

  const { data: template, error: insertError } = await supabase
    .from('contract_templates')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      content: body.content ?? [],
      variables: body.variables ?? [],
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return dbError(insertError, 'Failed to create template');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contract_template.created',
    resource_type: 'contract_template',
    resource_id: template.id,
    details: { name: body.name },
  });

  return success(template, 201);
}
