import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') ?? '';
  const status = searchParams.get('status') ?? '';

  let query = supabase
    .from('social_accounts')
    .select('*', { count: 'exact' })
    .order('platform', { ascending: true })
    .order('created_at', { ascending: false });

  if (platform) {
    query = query.eq('platform', platform);
  }
  if (status) {
    query = query.eq('status', status);
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
    .from('social_accounts')
    .insert({
      tenant_id: profile.tenant_id,
      platform: body.platform,
      account_name: body.account_name,
      account_id: body.account_id,
      avatar_url: body.avatar_url ?? null,
      status: body.status ?? 'active',
      metadata: body.metadata ?? null,
      connected_by: user.id,
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
