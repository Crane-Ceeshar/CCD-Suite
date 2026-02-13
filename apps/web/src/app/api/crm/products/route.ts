import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createProductSchema, productListQuerySchema } from '@/lib/api/schemas/crm';
import { rateLimit } from '@/lib/api/rate-limit';
import { validateCsrf } from '@/lib/api/csrf';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject, sanitizeSearchQuery } from '@/lib/api/sanitize';

export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'crm:products:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    productListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, limit, offset } = query!;

  let dbQuery = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safe = sanitizeSearchQuery(search);
    dbQuery = dbQuery.or(`name.ilike.%${safe}%,sku.ilike.%${safe}%,category.ilike.%${safe}%`);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    // Table might not exist yet
    if (queryError.code === '42P01') {
      return NextResponse.json({ success: true, data: [], count: 0 });
    }
    return dbError(queryError, 'Failed to fetch products');
  }

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'crm:products:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createProductSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const { data, error: insertError } = await supabase
    .from('products')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      sku: body.sku ?? null,
      price: body.price ?? 0,
      currency: body.currency ?? 'USD',
      category: body.category ?? null,
      is_active: body.is_active ?? true,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) return dbError(insertError, 'Failed to create product');

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'product.created',
    resource_type: 'product',
    resource_id: data.id,
    details: { name: body.name },
  });

  return success(data, 201);
}
