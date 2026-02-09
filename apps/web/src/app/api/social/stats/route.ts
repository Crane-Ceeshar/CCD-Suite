import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  try {
    const [accountsRes, scheduledRes, engagementRes] = await Promise.all([
      supabase
        .from('social_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('social_posts')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled'),
      supabase
        .from('social_engagement')
        .select('likes, comments, shares, impressions, reach'),
    ]);

    const accounts = accountsRes.count ?? 0;
    const scheduledPosts = scheduledRes.count ?? 0;

    const engagementData = engagementRes.data ?? [];

    const totals = engagementData.reduce(
      (acc: { likes: number; comments: number; shares: number; impressions: number; reach: number }, row: { likes: number; comments: number; shares: number; impressions: number; reach: number }) => {
        acc.likes += row.likes ?? 0;
        acc.comments += row.comments ?? 0;
        acc.shares += row.shares ?? 0;
        acc.impressions += row.impressions ?? 0;
        acc.reach += row.reach ?? 0;
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0 }
    );

    const totalEngagement = totals.likes + totals.comments + totals.shares;
    const engagementRate =
      totals.impressions > 0
        ? Math.round((totalEngagement / totals.impressions) * 10000) / 100
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        accounts,
        scheduled_posts: scheduledPosts,
        total_engagement: totalEngagement,
        total_reach: totals.reach,
        engagement_rate: engagementRate,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch social stats' } },
      { status: 500 }
    );
  }
}
