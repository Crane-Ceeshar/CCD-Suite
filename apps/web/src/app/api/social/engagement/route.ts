import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id') ?? '';
    const period = searchParams.get('period') ?? '';

    let query = supabase
      .from('social_engagement')
      .select('likes, comments, shares, impressions, reach, clicks');

    if (postId) {
      query = query.eq('post_id', postId);
    }

    if (period) {
      const now = new Date();
      let since: Date;

      switch (period) {
        case 'last7d':
          since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last30d':
          since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last90d':
          since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          since = new Date(0);
      }

      query = query.gte('recorded_at', since.toISOString());
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json(
        { success: false, error: { message: queryError.message } },
        { status: 500 }
      );
    }

    const rows = data ?? [];

    const totals = rows.reduce(
      (acc: { likes: number; comments: number; shares: number; impressions: number; reach: number; clicks: number }, row: { likes: number; comments: number; shares: number; impressions: number; reach: number; clicks: number }) => {
        acc.likes += row.likes ?? 0;
        acc.comments += row.comments ?? 0;
        acc.shares += row.shares ?? 0;
        acc.impressions += row.impressions ?? 0;
        acc.reach += row.reach ?? 0;
        acc.clicks += row.clicks ?? 0;
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0, clicks: 0 }
    );

    const totalEngagement = totals.likes + totals.comments + totals.shares;
    const engagementRate =
      totals.impressions > 0
        ? Math.round((totalEngagement / totals.impressions) * 10000) / 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        ...totals,
        total_engagement: totalEngagement,
        engagement_rate: engagementRate,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch engagement metrics' } },
      { status: 500 }
    );
  }
}
