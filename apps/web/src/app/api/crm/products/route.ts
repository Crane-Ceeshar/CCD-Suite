import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,category.ilike.%${search}%`);
  }

  const { data, error: queryError, count } = await query;

  if (queryError) {
    // Table might not exist yet
    if (queryError.code === '42P01') {
      return NextResponse.json({ success: true, data: [], count: 0 });
    }
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

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
