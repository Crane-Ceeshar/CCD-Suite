import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') ?? '';
  const sentiment = searchParams.get('sentiment') ?? '';
  const replied = searchParams.get('replied') ?? '';
  const postId = searchParams.get('post_id') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '100', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('social_comments')
    .select('*', { count: 'exact' })
    .order('posted_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (platform) {
    query = query.eq('platform', platform);
  }
  if (sentiment) {
    query = query.eq('sentiment', sentiment);
  }
  if (replied === 'true') {
    query = query.eq('replied', true);
  } else if (replied === 'false') {
    query = query.eq('replied', false);
  }
  if (postId) {
    query = query.eq('post_id', postId);
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
