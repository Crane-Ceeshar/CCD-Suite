import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { trendsQuerySchema } from '@/lib/api/schemas/analytics';
import { getPeriodStart, getTimeBuckets, findBucketIndex } from '@/lib/analytics/period-helpers';

/**
 * GET /api/analytics/trends
 * Returns time-series data for charts. Supports multiple metric types.
 * Query params:
 *  - period: 7d | 30d | 90d | ytd (default: 30d)
 *  - metric: revenue | content | social | seo | all (default: all)
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    trendsQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  try {
    const { period, metric } = query!;
    const since = getPeriodStart(period);
    const buckets = getTimeBuckets(period);

    const results: Record<string, unknown> = { period };

    // ── Revenue Trend (deals won by time bucket) ─────────────────
    if (metric === 'all' || metric === 'revenue') {
      const { data: deals } = await supabase
        .from('deals')
        .select('value, status, actual_close_date')
        .eq('status', 'won')
        .not('actual_close_date', 'is', null)
        .gte('actual_close_date', since);

      const revenueBuckets = [...buckets.map((b) => ({ ...b, value: 0, count: 0 }))];
      for (const deal of deals ?? []) {
        const idx = findBucketIndex(revenueBuckets, deal.actual_close_date);
        if (idx >= 0) {
          revenueBuckets[idx].value += deal.value ?? 0;
          revenueBuckets[idx].count += 1;
        }
      }
      results.revenue = revenueBuckets;
    }

    // ── Content Published Trend ──────────────────────────────────
    if (metric === 'all' || metric === 'content') {
      const { data: items } = await supabase
        .from('content_items')
        .select('status, created_at, publish_date')
        .gte('created_at', since);

      const contentBuckets = [...buckets.map((b) => ({ ...b, created: 0, published: 0 }))];
      for (const item of items ?? []) {
        const createdIdx = findBucketIndex(contentBuckets, item.created_at);
        if (createdIdx >= 0) contentBuckets[createdIdx].created += 1;

        if (item.status === 'published' && item.publish_date) {
          const pubIdx = findBucketIndex(contentBuckets, item.publish_date);
          if (pubIdx >= 0) contentBuckets[pubIdx].published += 1;
        }
      }
      results.content = contentBuckets;
    }

    // ── Social Engagement Trend ──────────────────────────────────
    if (metric === 'all' || metric === 'social') {
      const { data: engagement } = await supabase
        .from('social_engagement')
        .select('likes, comments, shares, recorded_at')
        .gte('recorded_at', since);

      const socialBuckets = [
        ...buckets.map((b) => ({ ...b, likes: 0, comments: 0, shares: 0, total: 0 })),
      ];
      for (const e of engagement ?? []) {
        const idx = findBucketIndex(socialBuckets, e.recorded_at);
        if (idx >= 0) {
          socialBuckets[idx].likes += e.likes ?? 0;
          socialBuckets[idx].comments += e.comments ?? 0;
          socialBuckets[idx].shares += e.shares ?? 0;
          socialBuckets[idx].total +=
            (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0);
        }
      }
      results.social = socialBuckets;
    }

    // ── SEO Score Trend ──────────────────────────────────────────
    if (metric === 'all' || metric === 'seo') {
      const { data: audits } = await supabase
        .from('seo_audits')
        .select('score, completed_at')
        .eq('status', 'completed')
        .gte('completed_at', since)
        .order('completed_at', { ascending: true });

      const seoBuckets = [...buckets.map((b) => ({ ...b, score: 0, audits: 0 }))];
      for (const audit of audits ?? []) {
        const idx = findBucketIndex(seoBuckets, audit.completed_at);
        if (idx >= 0) {
          seoBuckets[idx].score =
            seoBuckets[idx].audits > 0
              ? Math.round(
                  (seoBuckets[idx].score * seoBuckets[idx].audits + audit.score) /
                    (seoBuckets[idx].audits + 1)
                )
              : audit.score;
          seoBuckets[idx].audits += 1;
        }
      }
      results.seo = seoBuckets;
    }

    const response = success(results);
    response.headers.set('Cache-Control', 'private, max-age=120');
    return response;
  } catch (err) {
    console.error('Analytics trends error:', err);
    return error('Failed to fetch analytics trends');
  }
}
