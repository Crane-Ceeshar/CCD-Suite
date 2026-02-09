import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const keywordId = searchParams.get('keyword_id') ?? '';
  const searchEngine = searchParams.get('search_engine') ?? '';
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  if (!keywordId) {
    return NextResponse.json(
      { success: false, error: { message: 'keyword_id is required' } },
      { status: 400 }
    );
  }

  let query = supabase
    .from('seo_rank_history')
    .select('rank, date, search_engine')
    .eq('keyword_id', keywordId)
    .order('date', { ascending: true });

  if (searchEngine) {
    query = query.eq('search_engine', searchEngine);
  }
  if (from) {
    query = query.gte('date', from);
  }
  if (to) {
    query = query.lte('date', to);
  }

  const { data, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}
