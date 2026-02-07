import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const companyId = searchParams.get('company_id') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('contacts')
    .select('*, company:companies(id, name)', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (status) {
    query = query.eq('status', status);
  }
  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error: queryError, count } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data, count });
}

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();

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
      created_by: user.id,
    })
    .select('*, company:companies(id, name)')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
