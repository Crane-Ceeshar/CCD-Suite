import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { insightsBodySchema } from '@/lib/api/schemas/analytics';
import { getPeriodStart } from '@/lib/analytics/period-helpers';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

/**
 * POST /api/analytics/insights
 * Gathers aggregated metrics from Supabase (deals, social, content, SEO)
 * and sends them to the AI gateway for natural-language insight generation.
 * Falls back to rule-based insights if the gateway is unavailable.
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: { session } } = await supabase.auth.getSession();

  const { data: body, error: bodyError } = await validateBody(request, insightsBodySchema);
  if (bodyError) return bodyError;

  const period = body?.period || '30d';
  const since = getPeriodStart(period);

  try {
    // ── Gather current metrics from Supabase ──────────────────────
    const [
      dealsResult,
      socialResult,
      seoAuditResult,
      seoKeywordsResult,
      contentResult,
    ] = await Promise.all([
      supabase
        .from('deals')
        .select('id, value, status, created_at')
        .gte('created_at', since),
      supabase
        .from('social_engagement')
        .select('likes, comments, shares, impressions')
        .gte('recorded_at', since),
      supabase
        .from('seo_audits')
        .select('score, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1),
      supabase
        .from('seo_keywords')
        .select('current_rank')
        .eq('status', 'tracking'),
      supabase
        .from('content_items')
        .select('id, status, created_at')
        .gte('created_at', since),
    ]);

    const deals = dealsResult.data ?? [];
    const engagement = socialResult.data ?? [];
    const seoAudits = seoAuditResult.data ?? [];
    const keywords = seoKeywordsResult.data ?? [];
    const contentItems = contentResult.data ?? [];

    // ── Compute aggregated metrics ────────────────────────────────
    const wonDeals = deals.filter((d) => d.status === 'won');
    const openDeals = deals.filter((d) => d.status === 'open');
    const totalRevenue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);

    const totalLikes = engagement.reduce((s, e) => s + (e.likes ?? 0), 0);
    const totalComments = engagement.reduce((s, e) => s + (e.comments ?? 0), 0);
    const totalShares = engagement.reduce((s, e) => s + (e.shares ?? 0), 0);
    const totalImpressions = engagement.reduce((s, e) => s + (e.impressions ?? 0), 0);
    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate =
      totalImpressions > 0
        ? Math.round((totalEngagement / totalImpressions) * 10000) / 100
        : 0;

    const latestAuditScore = seoAudits.length > 0 ? seoAudits[0].score : null;
    const trackingKeywords = keywords.filter((k) => k.current_rank != null);
    const avgKeywordPosition =
      trackingKeywords.length > 0
        ? Math.round(
            trackingKeywords.reduce((s, k) => s + (k.current_rank ?? 0), 0) /
              trackingKeywords.length
          )
        : null;

    const publishedContent = contentItems.filter((c) => c.status === 'published').length;
    const draftContent = contentItems.filter((c) => c.status === 'draft').length;

    const metricsData = {
      period,
      crm: {
        total_revenue: totalRevenue,
        pipeline_value: pipelineValue,
        active_deals: openDeals.length,
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
        total: contentItems.length,
        published: publishedContent,
        drafts: draftContent,
      },
    };

    // ── Send to AI gateway ────────────────────────────────────────
    try {
      const res = await fetch(`${GATEWAY_URL}/api/ai/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          type: 'analytics_insights',
          data: metricsData,
          prompt:
            'Analyze these metrics and provide 3-5 actionable insights. For each insight, include a type (positive, warning, info, or action), a short title, and a description. Return JSON array: [{ type, title, description }]',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return success({
          insights: data.data?.insights ?? data.insights ?? data.data ?? [],
          source: 'ai',
          metrics: metricsData,
        });
      }
    } catch {
      // Gateway unavailable, fall through to fallback
    }

    // ── Fallback: generate rule-based insights ────────────────────
    const fallbackInsights = generateFallbackInsights(metricsData);

    return success({
      insights: fallbackInsights,
      source: 'fallback',
      metrics: metricsData,
    });
  } catch (err) {
    console.error('Analytics insights error:', err);
    return error('Failed to generate analytics insights');
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

interface MetricsData {
  period: string;
  crm: {
    total_revenue: number;
    pipeline_value: number;
    active_deals: number;
    won_deals: number;
    total_deals: number;
  };
  social: {
    total_engagement: number;
    engagement_rate: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  seo: {
    audit_score: number | null;
    avg_keyword_position: number | null;
    tracked_keywords: number;
  };
  content: {
    total: number;
    published: number;
    drafts: number;
  };
}

interface Insight {
  type: 'positive' | 'warning' | 'info' | 'action';
  title: string;
  description: string;
}

function generateFallbackInsights(metrics: MetricsData): Insight[] {
  const insights: Insight[] = [];
  const { crm, social, seo, content } = metrics;

  // CRM insights
  if (crm.total_revenue > 0) {
    insights.push({
      type: 'positive',
      title: 'Revenue Performance',
      description: `Revenue is $${crm.total_revenue.toLocaleString()} from ${crm.won_deals} closed deal${crm.won_deals !== 1 ? 's' : ''} this period.`,
    });
  }
  if (crm.pipeline_value > 0) {
    insights.push({
      type: 'info',
      title: 'Pipeline Overview',
      description: `You have ${crm.active_deals} active deal${crm.active_deals !== 1 ? 's' : ''} worth $${crm.pipeline_value.toLocaleString()} in your pipeline.`,
    });
  }
  if (crm.total_deals > 0 && crm.won_deals === 0) {
    insights.push({
      type: 'warning',
      title: 'No Closed Deals',
      description: `You have ${crm.total_deals} deal${crm.total_deals !== 1 ? 's' : ''} but none closed this period. Focus on advancing deals to close.`,
    });
  }

  // Social insights
  if (social.total_engagement > 0) {
    insights.push({
      type: social.engagement_rate >= 3 ? 'positive' : 'info',
      title: 'Social Engagement',
      description: `Social engagement is at ${social.total_engagement.toLocaleString()} interactions (${social.engagement_rate}% rate) across ${social.impressions.toLocaleString()} impressions.`,
    });
  }
  if (social.impressions === 0) {
    insights.push({
      type: 'action',
      title: 'Boost Social Presence',
      description: 'No social impressions recorded this period. Schedule posts to increase visibility and engagement.',
    });
  }

  // SEO insights
  if (seo.audit_score !== null) {
    const scoreType = seo.audit_score >= 80 ? 'positive' : seo.audit_score >= 50 ? 'warning' : 'action';
    insights.push({
      type: scoreType,
      title: 'SEO Health Score',
      description: `Latest SEO audit score is ${seo.audit_score}/100.${seo.audit_score < 80 ? ' Review audit recommendations to improve rankings.' : ' Great job maintaining SEO health.'}`,
    });
  }
  if (seo.avg_keyword_position !== null) {
    insights.push({
      type: seo.avg_keyword_position <= 10 ? 'positive' : 'info',
      title: 'Keyword Rankings',
      description: `Tracking ${seo.tracked_keywords} keyword${seo.tracked_keywords !== 1 ? 's' : ''} with an average position of ${seo.avg_keyword_position}.`,
    });
  }

  // Content insights
  if (content.total > 0) {
    insights.push({
      type: 'info',
      title: 'Content Activity',
      description: `${content.published} content item${content.published !== 1 ? 's' : ''} published this period, with ${content.drafts} draft${content.drafts !== 1 ? 's' : ''} in progress.`,
    });
  }
  if (content.drafts > 3) {
    insights.push({
      type: 'action',
      title: 'Publish Drafts',
      description: `You have ${content.drafts} unpublished drafts. Review and publish them to keep your content pipeline flowing.`,
    });
  }

  // Return top 5 insights
  return insights.slice(0, 5);
}
