import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  try {
    const [keywordsRes, avgRankRes, backlinksRes, latestAuditRes] = await Promise.all([
      supabase
        .from('seo_keywords')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'tracking'),
      supabase
        .from('seo_keywords')
        .select('current_rank')
        .not('current_rank', 'is', null),
      supabase
        .from('seo_backlinks')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      supabase
        .from('seo_audits')
        .select('score')
        .order('created_at', { ascending: false })
        .limit(1),
    ]);

    const trackedKeywords = keywordsRes.count ?? 0;

    const ranks = (avgRankRes.data ?? []) as { current_rank: number }[];
    const avgPosition =
      ranks.length > 0
        ? Math.round(
            (ranks.reduce((sum, r) => sum + r.current_rank, 0) / ranks.length) * 10
          ) / 10
        : null;

    const activeBacklinks = backlinksRes.count ?? 0;

    const latestAuditScore =
      latestAuditRes.data && latestAuditRes.data.length > 0
        ? (latestAuditRes.data[0] as { score: number | null }).score
        : null;

    return NextResponse.json({
      success: true,
      data: {
        tracked_keywords: trackedKeywords,
        avg_position: avgPosition,
        active_backlinks: activeBacklinks,
        latest_audit_score: latestAuditScore,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch SEO stats' } },
      { status: 500 }
    );
  }
}
