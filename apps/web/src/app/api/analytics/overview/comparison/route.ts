import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { z } from 'zod';
import { getPeriodStart } from '@/lib/analytics/period-helpers';

const comparisonQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', 'ytd']).default('30d'),
});

/** Return the number of days for a period string */
function periodDays(period: string): number {
  switch (period) {
    case '7d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case 'ytd': {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return Math.ceil((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    }
    default:
      return 30;
  }
}

/** Calculate the ISO date for the start of the previous period */
function getPreviousPeriodStart(period: string): string {
  const days = periodDays(period);
  const now = new Date();
  now.setDate(now.getDate() - days * 2);
  return now.toISOString();
}

/** Calculate the ISO date for the end of the previous period (= start of current period) */
function getPreviousPeriodEnd(period: string): string {
  return getPeriodStart(period);
}

interface PeriodMetrics {
  revenue: number;
  deals: number;
  engagement: number;
  impressions: number;
  published_content: number;
}

/** Compute delta percentage: ((current - previous) / previous) * 100 */
function delta(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

/**
 * GET /api/analytics/overview/comparison
 * Returns current period metrics, previous period metrics, and percentage deltas.
 * Query: ?period=30d
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    comparisonQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  try {
    const period = query!.period;
    const currentStart = getPeriodStart(period);
    const previousStart = getPreviousPeriodStart(period);
    const previousEnd = getPreviousPeriodEnd(period);

    // Fetch current + previous period data in parallel
    const [
      currentDeals,
      previousDeals,
      currentEngagement,
      previousEngagement,
      currentContent,
      previousContent,
    ] = await Promise.all([
      // Current period deals
      supabase
        .from('deals')
        .select('value, status')
        .gte('created_at', currentStart),
      // Previous period deals
      supabase
        .from('deals')
        .select('value, status')
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd),
      // Current period social engagement
      supabase
        .from('social_engagement')
        .select('likes, comments, shares, impressions')
        .gte('recorded_at', currentStart),
      // Previous period social engagement
      supabase
        .from('social_engagement')
        .select('likes, comments, shares, impressions')
        .gte('recorded_at', previousStart)
        .lt('recorded_at', previousEnd),
      // Current period content
      supabase
        .from('content_items')
        .select('id, status')
        .eq('status', 'published')
        .gte('created_at', currentStart),
      // Previous period content
      supabase
        .from('content_items')
        .select('id, status')
        .eq('status', 'published')
        .gte('created_at', previousStart)
        .lt('created_at', previousEnd),
    ]);

    function computeMetrics(
      deals: typeof currentDeals.data,
      engagement: typeof currentEngagement.data,
      content: typeof currentContent.data
    ): PeriodMetrics {
      const d = deals ?? [];
      const e = engagement ?? [];
      const c = content ?? [];

      const wonDeals = d.filter((deal) => deal.status === 'won');
      const revenue = wonDeals.reduce((s, deal) => s + (deal.value ?? 0), 0);

      const totalEngagement = e.reduce(
        (s, row) => s + (row.likes ?? 0) + (row.comments ?? 0) + (row.shares ?? 0),
        0
      );
      const totalImpressions = e.reduce((s, row) => s + (row.impressions ?? 0), 0);

      return {
        revenue,
        deals: d.length,
        engagement: totalEngagement,
        impressions: totalImpressions,
        published_content: c.length,
      };
    }

    const current = computeMetrics(
      currentDeals.data,
      currentEngagement.data,
      currentContent.data
    );
    const previous = computeMetrics(
      previousDeals.data,
      previousEngagement.data,
      previousContent.data
    );

    const deltas = {
      revenue_pct: delta(current.revenue, previous.revenue),
      deals_pct: delta(current.deals, previous.deals),
      engagement_pct: delta(current.engagement, previous.engagement),
      impressions_pct: delta(current.impressions, previous.impressions),
      published_content_pct: delta(current.published_content, previous.published_content),
    };

    const response = success({ period, current, previous, deltas });
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (err) {
    console.error('Analytics comparison error:', err);
    return error('Failed to compute comparison metrics');
  }
}
