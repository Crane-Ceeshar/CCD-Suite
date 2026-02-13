import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createDealSchema, dealListQuerySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject, sanitizeSearchQuery } from '@/lib/api/sanitize';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:deals:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    dealListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, stage_id: stageId, company_id: companyId, contact_id: contactId, limit, offset } = query!;

  let dbQuery = supabase
    .from('deals')
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safe = sanitizeSearchQuery(search);
    dbQuery = dbQuery.ilike('title', `%${safe}%`);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (stageId) {
    dbQuery = dbQuery.eq('stage_id', stageId);
  }
  if (companyId) {
    dbQuery = dbQuery.eq('company_id', companyId);
  }
  if (contactId) {
    dbQuery = dbQuery.eq('contact_id', contactId);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) return dbError(queryError, 'Failed to fetch deals');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:deals:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createDealSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  // Determine position: last in the stage
  const { count } = await supabase
    .from('deals')
    .select('id', { count: 'exact', head: true })
    .eq('stage_id', body.stage_id);

  const { data, error: insertError } = await supabase
    .from('deals')
    .insert({
      tenant_id: profile.tenant_id,
      pipeline_id: body.pipeline_id,
      stage_id: body.stage_id,
      title: body.title,
      value: body.value ?? 0,
      currency: body.currency ?? 'USD',
      company_id: body.company_id ?? null,
      contact_id: body.contact_id ?? null,
      expected_close_date: body.expected_close_date ?? null,
      notes: body.notes ?? null,
      assigned_to: body.assigned_to ?? null,
      position: (count ?? 0),
      status: 'open',
      created_by: user.id,
    })
    .select(
      '*, company:companies(id, name), contact:contacts(id, first_name, last_name), stage:pipeline_stages(id, name, color)'
    )
    .single();

  if (insertError) return dbError(insertError, 'Failed to create deal');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'deal.created',
    resource_type: 'deal',
    resource_id: data.id,
    details: { title: body.title, value: body.value },
  });

  return success(data, 201);
}
