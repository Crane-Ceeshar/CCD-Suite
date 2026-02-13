import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createContactSchema, contactListQuerySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject, sanitizeSearchQuery } from '@/lib/api/sanitize';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:contacts:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    contactListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, company_id: companyId, limit, offset } = query!;

  let dbQuery = supabase
    .from('contacts')
    .select('*, company:companies(id, name)', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safe = sanitizeSearchQuery(search);
    dbQuery = dbQuery.or(`first_name.ilike.%${safe}%,last_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (companyId) {
    dbQuery = dbQuery.eq('company_id', companyId);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) return dbError(queryError, 'Failed to fetch contacts');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:contacts:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createContactSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const { data, error: insertError } = await supabase
    .from('contacts')
    .insert({
      tenant_id: profile.tenant_id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      job_title: body.job_title ?? null,
      company_id: body.company_id ?? null,
      status: body.status ?? 'active',
      notes: body.notes ?? null,
      website: body.website ?? null,
      lead_source: body.lead_source ?? null,
      lead_status: body.lead_status ?? null,
      qualification: body.qualification ?? null,
      priority: body.priority ?? null,
      comment: body.comment ?? null,
      created_by: user.id,
    })
    .select('*, company:companies(id, name)')
    .single();

  if (insertError) return dbError(insertError, 'Failed to create contact');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'contact.created',
    resource_type: 'contact',
    resource_id: data.id,
    details: { first_name: body.first_name, last_name: body.last_name },
  });

  return success(data, 201);
}
