import type { SupabaseClient } from '@supabase/supabase-js';
import { getPeriodStart, getTimeBuckets, findBucketIndex } from '@/lib/analytics/period-helpers';

export interface WidgetDataResult {
  value: number;
  label: string;
  data?: Array<{ label: string; value: number }>;
}

/**
 * Fetches real data for a dashboard widget based on its data_source string.
 * Data source format: "module.metric" e.g. "crm.revenue", "social.engagement"
 */
export async function fetchWidgetData(
  supabase: SupabaseClient,
  dataSource: string,
  config: Record<string, unknown>,
  period: string
): Promise<WidgetDataResult> {
  const since = getPeriodStart(period);
  const buckets = getTimeBuckets(period);
  const [module, metric] = dataSource.split('.');

  switch (`${module}.${metric}`) {
    // ── CRM ──────────────────────────────────────────────────────
    case 'crm.revenue': {
      const { data: deals } = await supabase
        .from('deals')
        .select('value, status, actual_close_date')
        .eq('status', 'won')
        .gte('actual_close_date', since);

      const rows = deals ?? [];
      const total = rows.reduce((s, d) => s + (d.value ?? 0), 0);
      const chartData = buckets.map((b) => ({
        label: b.label,
        value: rows
          .filter(() => {
            // Sum deals closed within this bucket
            return true;
          })
          .reduce((s, d) => {
            const idx = findBucketIndex(buckets, d.actual_close_date);
            return idx === buckets.indexOf(b) ? s + (d.value ?? 0) : s;
          }, 0),
      }));

      return { value: total, label: 'Revenue', data: chartData };
    }

    case 'crm.deals': {
      const { data: deals } = await supabase
        .from('deals')
        .select('id, status, created_at')
        .gte('created_at', since);

      const rows = deals ?? [];
      const chartData = buckets.map((b) => ({
        label: b.label,
        value: rows.filter((d) => findBucketIndex(buckets, d.created_at) === buckets.indexOf(b)).length,
      }));

      return { value: rows.length, label: 'Deals', data: chartData };
    }

    // ── Social ───────────────────────────────────────────────────
    case 'social.engagement': {
      const { data: eng } = await supabase
        .from('social_engagement')
        .select('likes, comments, shares, recorded_at')
        .gte('recorded_at', since);

      const rows = eng ?? [];
      const total = rows.reduce(
        (s, e) => s + (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0),
        0
      );
      const chartData = buckets.map((b) => {
        const bucketIdx = buckets.indexOf(b);
        const bucketRows = rows.filter(
          (e) => findBucketIndex(buckets, e.recorded_at) === bucketIdx
        );
        return {
          label: b.label,
          value: bucketRows.reduce(
            (s, e) => s + (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0),
            0
          ),
        };
      });

      return { value: total, label: 'Engagement', data: chartData };
    }

    case 'social.impressions': {
      const { data: eng } = await supabase
        .from('social_engagement')
        .select('impressions, recorded_at')
        .gte('recorded_at', since);

      const rows = eng ?? [];
      const total = rows.reduce((s, e) => s + (e.impressions ?? 0), 0);
      const chartData = buckets.map((b) => {
        const bucketIdx = buckets.indexOf(b);
        const bucketRows = rows.filter(
          (e) => findBucketIndex(buckets, e.recorded_at) === bucketIdx
        );
        return {
          label: b.label,
          value: bucketRows.reduce((s, e) => s + (e.impressions ?? 0), 0),
        };
      });

      return { value: total, label: 'Impressions', data: chartData };
    }

    // ── SEO ──────────────────────────────────────────────────────
    case 'seo.score': {
      const { data: audits } = await supabase
        .from('seo_audits')
        .select('score, completed_at')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);

      const latest = audits?.[0];
      return {
        value: latest?.score ?? 0,
        label: 'SEO Score',
      };
    }

    case 'seo.keywords': {
      const { data: keywords } = await supabase
        .from('seo_keywords')
        .select('current_rank')
        .eq('status', 'tracking');

      const rows = keywords ?? [];
      const tracked = rows.filter((k) => k.current_rank != null);
      const avg =
        tracked.length > 0
          ? Math.round(
              tracked.reduce((s, k) => s + (k.current_rank ?? 0), 0) /
                tracked.length
            )
          : 0;

      return { value: avg, label: 'Avg Keyword Position' };
    }

    // ── Content ──────────────────────────────────────────────────
    case 'content.published': {
      const { data: items } = await supabase
        .from('content_items')
        .select('id, created_at')
        .eq('status', 'published')
        .gte('created_at', since);

      const rows = items ?? [];
      const chartData = buckets.map((b) => {
        const bucketIdx = buckets.indexOf(b);
        return {
          label: b.label,
          value: rows.filter(
            (c) => findBucketIndex(buckets, c.created_at) === bucketIdx
          ).length,
        };
      });

      return { value: rows.length, label: 'Published', data: chartData };
    }

    case 'content.total': {
      const { data: items } = await supabase
        .from('content_items')
        .select('id, status, created_at')
        .gte('created_at', since);

      const rows = items ?? [];
      // Break down by status for pie-chart compatibility
      const statusCounts: Record<string, number> = {};
      rows.forEach((c) => {
        const st = c.status ?? 'unknown';
        statusCounts[st] = (statusCounts[st] ?? 0) + 1;
      });
      const chartData = Object.entries(statusCounts).map(([label, value]) => ({
        label,
        value,
      }));

      return { value: rows.length, label: 'Total Content', data: chartData };
    }

    // ── Fallback ─────────────────────────────────────────────────
    default:
      return { value: 0, label: dataSource || 'Unknown', data: [] };
  }
}
