import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createActivitySchema, activityListQuerySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject } from '@/lib/api/sanitize';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:activities:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    activityListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { type, deal_id: dealId, contact_id: contactId, company_id: companyId, limit, offset } = query!;

  let dbQuery = supabase
    .from('activities')
    .select(
      '*, deal:deals(id, title), contact:contacts(id, first_name, last_name), company:companies(id, name)',
      { count: 'exact' }
    )
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) dbQuery = dbQuery.eq('type', type);
  if (dealId) dbQuery = dbQuery.eq('deal_id', dealId);
  if (contactId) dbQuery = dbQuery.eq('contact_id', contactId);
  if (companyId) dbQuery = dbQuery.eq('company_id', companyId);

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) return dbError(queryError, 'Failed to fetch activities');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:activities:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createActivitySchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const { data, error: insertError } = await supabase
    .from('activities')
    .insert({
      tenant_id: profile.tenant_id,
      type: body.type,
      title: body.title,
      description: body.description ?? null,
      deal_id: body.deal_id ?? null,
      contact_id: body.contact_id ?? null,
      company_id: body.company_id ?? null,
      scheduled_at: body.scheduled_at ?? null,
      created_by: user.id,
    })
    .select(
      '*, deal:deals(id, title), contact:contacts(id, first_name, last_name), company:companies(id, name)'
    )
    .single();

  if (insertError) return dbError(insertError, 'Failed to create activity');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'activity.created',
    resource_type: 'activity',
    resource_id: data.id,
    details: { title: body.title, type: body.type },
  });

  return success(data, 201);
}
