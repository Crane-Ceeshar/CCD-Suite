import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError, success } from '@/lib/api/responses';
import { sanitizeObject, sanitizeSearchQuery } from '@/lib/api/sanitize';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    const safe = sanitizeSearchQuery(search);
    query = query.or(`name.ilike.%${safe}%,industry.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }

  const { data, error: queryError, count } = await query;

  if (queryError) return dbError(queryError, 'Failed to fetch companies');

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const body = sanitizeObject(await request.json());

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

  return success(data, 201);
}
