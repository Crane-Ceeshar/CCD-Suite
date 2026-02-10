import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { anomalyQuerySchema } from '@/lib/api/schemas/analytics-advanced';
import { getPeriodStart } from '@/lib/analytics/period-helpers';
import { detectAnomalies, type TimeSeriesPoint } from '@/lib/analytics/anomaly-detector';

/**
 * GET /api/analytics/anomalies
 * Detect anomalies in analytics time-series data.
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    anomalyQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  try {
    const { metric, period, sigma } = query!;
    const since = getPeriodStart(period);

    const results: {
      metric: string;
      anomalies: ReturnType<typeof detectAnomalies>['anomalies'];
      mean: number;
      stdDev: number;
    }[] = [];

    // ── Revenue anomalies ────────────────────────────────────────
    if (metric === 'all' || metric === 'revenue') {
      const { data: deals } = await supabase
        .from('deals')
        .select('value, actual_close_date')
        .eq('status', 'won')
        .not('actual_close_date', 'is', null)
        .gte('actual_close_date', since)
        .order('actual_close_date', { ascending: true });

      // Aggregate by day
      const dailyRevenue = new Map<string, number>();
      for (const deal of deals ?? []) {
        const day = deal.actual_close_date.substring(0, 10);
        dailyRevenue.set(day, (dailyRevenue.get(day) ?? 0) + (deal.value ?? 0));
      }

      const revenueSeries: TimeSeriesPoint[] = Array.from(dailyRevenue.entries()).map(
        ([date, value]) => ({ date, value })
      );

      if (revenueSeries.length >= 3) {
        const result = detectAnomalies(revenueSeries, sigma);
        if (result.anomalies.length > 0) {
          results.push({
            metric: 'revenue',
            anomalies: result.anomalies,
            mean: result.mean,
            stdDev: result.stdDev,
          });
        }
      }
    }

    // ── Engagement anomalies ─────────────────────────────────────
    if (metric === 'all' || metric === 'engagement') {
      const { data: engagement } = await supabase
        .from('social_engagement')
        .select('likes, comments, shares, recorded_at')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });

      // Aggregate by day
      const dailyEngagement = new Map<string, number>();
      for (const e of engagement ?? []) {
        const day = e.recorded_at.substring(0, 10);
        const total = (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0);
        dailyEngagement.set(day, (dailyEngagement.get(day) ?? 0) + total);
      }

      const engagementSeries: TimeSeriesPoint[] = Array.from(
        dailyEngagement.entries()
      ).map(([date, value]) => ({ date, value }));

      if (engagementSeries.length >= 3) {
        const result = detectAnomalies(engagementSeries, sigma);
        if (result.anomalies.length > 0) {
          results.push({
            metric: 'engagement',
            anomalies: result.anomalies,
            mean: result.mean,
            stdDev: result.stdDev,
          });
        }
      }
    }

    // ── Content anomalies ────────────────────────────────────────
    if (metric === 'all' || metric === 'content') {
      const { data: items } = await supabase
        .from('content_items')
        .select('created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true });

      // Aggregate by day
      const dailyContent = new Map<string, number>();
      for (const item of items ?? []) {
        const day = item.created_at.substring(0, 10);
        dailyContent.set(day, (dailyContent.get(day) ?? 0) + 1);
      }

      const contentSeries: TimeSeriesPoint[] = Array.from(dailyContent.entries()).map(
        ([date, value]) => ({ date, value })
      );

      if (contentSeries.length >= 3) {
        const result = detectAnomalies(contentSeries, sigma);
        if (result.anomalies.length > 0) {
          results.push({
            metric: 'content',
            anomalies: result.anomalies,
            mean: result.mean,
            stdDev: result.stdDev,
          });
        }
      }
    }

    const response = success(results);
    response.headers.set('Cache-Control', 'private, max-age=120');
    return response;
  } catch (err) {
    console.error('Anomaly detection error:', err);
    return error('Failed to detect anomalies');
  }
}
