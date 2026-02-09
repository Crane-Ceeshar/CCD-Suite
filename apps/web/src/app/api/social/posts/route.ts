import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { publishPost, schedulePost } from '@/lib/services/social-publisher';
import { isConfigured } from '@/lib/services/ayrshare';

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
      media_urls: body.media_urls ?? [],
      platforms: body.platforms ?? [],
      scheduled_at: body.scheduled_at ?? null,
      status: body.status ?? 'draft',
      account_ids: body.account_ids ?? [],
      campaign_id: body.campaign_id ?? null,
      metadata: body.metadata ?? {},
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

  // If Ayrshare is configured, actually publish or schedule via the API
  if (isConfigured() && data) {
    if (body.status === 'published') {
      const result = await publishPost(data.id, supabase, profile.tenant_id);
      // Re-fetch to get updated status
      const { data: updated } = await supabase
        .from('social_posts')
        .select('*')
        .eq('id', data.id)
        .single();
      return NextResponse.json({
        success: result.success,
        data: updated ?? data,
        publish_result: result,
      }, { status: 201 });
    }

    if (body.status === 'scheduled' && body.scheduled_at) {
      const result = await schedulePost(data.id, body.scheduled_at, supabase, profile.tenant_id);
      const { data: updated } = await supabase
        .from('social_posts')
        .select('*')
        .eq('id', data.id)
        .single();
      return NextResponse.json({
        success: true,
        data: updated ?? data,
        schedule_result: result,
      }, { status: 201 });
    }
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
