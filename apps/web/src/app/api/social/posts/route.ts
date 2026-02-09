import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? '';
  const platform = searchParams.get('platform') ?? '';
  const campaignId = searchParams.get('campaign_id') ?? '';
  const search = searchParams.get('search') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('social_posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }
  if (platform) {
    query = query.contains('platforms', [platform]);
  }
  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }
  if (search) {
    query = query.ilike('content', `%${search}%`);
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
    .from('social_posts')
    .insert({
      tenant_id: profile.tenant_id,
      content: body.content,
      media_urls: body.media_urls ?? null,
      platforms: body.platforms ?? [],
      scheduled_at: body.scheduled_at ?? null,
      status: body.status ?? 'draft',
      account_ids: body.account_ids ?? null,
      campaign_id: body.campaign_id ?? null,
      metadata: body.metadata ?? null,
      created_by: user.id,
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
