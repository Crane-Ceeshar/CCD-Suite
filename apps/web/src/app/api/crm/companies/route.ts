import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createCompanySchema, companyListQuerySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject, sanitizeSearchQuery } from '@/lib/api/sanitize';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:companies:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    companyListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, limit, offset } = query!;

  let dbQuery = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safe = sanitizeSearchQuery(search);
    dbQuery = dbQuery.or(`name.ilike.%${safe}%,industry.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) return dbError(queryError, 'Failed to fetch companies');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:companies:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createCompanySchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const { data, error: insertError } = await supabase
    .from('companies')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      industry: body.industry ?? null,
      website: body.website ?? null,
      phone: body.phone ?? null,
      email: body.email ?? null,
      address: body.address ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      country: body.country ?? null,
      status: body.status ?? 'active',
      notes: body.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return dbError(insertError, 'Failed to create company');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'company.created',
    resource_type: 'company',
    resource_id: data.id,
    details: { name: body.name },
  });

  return success(data, 201);
}
