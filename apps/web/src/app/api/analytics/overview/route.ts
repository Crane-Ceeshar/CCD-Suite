import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { overviewQuerySchema } from '@/lib/api/schemas/analytics';
import { getPeriodStart } from '@/lib/analytics/period-helpers';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/analytics/overview
 * Aggregates KPIs from CRM, Social, SEO, Content, and Platform modules.
 * Supports ?period=7d|30d|90d|ytd query param for date filtering.
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, profile, user } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'analytics:overview' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    overviewQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  try {
    const period = query!.period;
    const since = getPeriodStart(period);

    // Run all queries in parallel for performance
    const [
      dealsResult,
      socialResult,
      seoAuditResult,
      seoKeywordsResult,
      contentResult,
      teamResult,
    ] = await Promise.all([
      // CRM: deals data
      supabase
        .from('deals')
        .select('id, value, status, created_at, actual_close_date')
        .gte('created_at', since),

      // Social: engagement totals
      supabase
        .from('social_engagement')
        .select('likes, comments, shares, impressions, reach, clicks')
        .gte('recorded_at', since),

      // SEO: latest audit score
      supabase
        .from('seo_audits')
        .select('score, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1),

      // SEO: keyword positions
      supabase
        .from('seo_keywords')
        .select('current_rank')
        .eq('status', 'tracking'),

      // Content: items by status
      supabase
        .from('content_items')
        .select('id, status, created_at')
        .gte('created_at', since),

      // Platform: team members
      supabase
        .from('profiles')
        .select('id')
        .eq('tenant_id', profile.tenant_id),
    ]);

    const deals = dealsResult.data ?? [];
    const engagement = socialResult.data ?? [];
    const seoAudits = seoAuditResult.data ?? [];
    const keywords = seoKeywordsResult.data ?? [];
    const contentItems = contentResult.data ?? [];
    const team = teamResult.data ?? [];

    // ── CRM Metrics ──────────────────────────────────────────────
    const wonDeals = deals.filter((d) => d.status === 'won');
    const openDeals = deals.filter((d) => d.status === 'open');
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const activeDeals = openDeals.length;

    // ── Social Metrics ───────────────────────────────────────────
    const totalLikes = engagement.reduce((s, e) => s + (e.likes ?? 0), 0);
    const totalComments = engagement.reduce((s, e) => s + (e.comments ?? 0), 0);
    const totalShares = engagement.reduce((s, e) => s + (e.shares ?? 0), 0);
    const totalImpressions = engagement.reduce((s, e) => s + (e.impressions ?? 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate =
      totalImpressions > 0
        ? Math.round(((totalEngagement) / totalImpressions) * 10000) / 100
        : 0;

    // ── SEO Metrics ──────────────────────────────────────────────
    const latestAuditScore = seoAudits.length > 0 ? seoAudits[0].score : null;
    const trackingKeywords = keywords.filter((k) => k.current_rank != null);
    const avgKeywordPosition =
      trackingKeywords.length > 0
        ? Math.round(
            trackingKeywords.reduce((s, k) => s + (k.current_rank ?? 0), 0) /
              trackingKeywords.length
          )
        : null;

    // ── Content Metrics ──────────────────────────────────────────
    const totalContent = contentItems.length;
    const publishedContent = contentItems.filter((c) => c.status === 'published').length;
    const draftContent = contentItems.filter((c) => c.status === 'draft').length;
    const scheduledContent = contentItems.filter((c) => c.status === 'scheduled').length;
    const inReviewContent = contentItems.filter((c) => c.status === 'review').length;

    const response = success({
      period,
      crm: {
        total_revenue: totalRevenue,
        pipeline_value: pipelineValue,
        active_deals: activeDeals,
        won_deals: wonDeals.length,
        total_deals: deals.length,
      },
      social: {
        total_engagement: totalEngagement,
        engagement_rate: engagementRate,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        impressions: totalImpressions,
      },
      seo: {
        audit_score: latestAuditScore,
        avg_keyword_position: avgKeywordPosition,
        tracked_keywords: keywords.length,
      },
      content: {
        total: totalContent,
        published: publishedContent,
        drafts: draftContent,
        scheduled: scheduledContent,
        in_review: inReviewContent,
      },
      team: {
        members: team.length,
      },
    });
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (err) {
    console.error('Analytics overview error:', err);
    return error('Failed to fetch analytics overview');
  }
}
