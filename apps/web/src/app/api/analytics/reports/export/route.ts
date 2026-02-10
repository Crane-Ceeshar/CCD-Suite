import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { error } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { reportExportSchema } from '@/lib/api/schemas/analytics';
import { getPeriodStart } from '@/lib/analytics/period-helpers';
import { rateLimit } from '@/lib/api/rate-limit';

const EXPORT_LIMIT = 10000;

/**
 * POST /api/analytics/reports/export
 * Generate a report export in CSV or JSON format.
 * Body: { report_id?, report_type, config: { metrics, period }, format: 'csv' | 'json' }
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 10, keyPrefix: 'analytics:export' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, reportExportSchema);
  if (bodyError) return bodyError;

  const { report_type, config, format } = body;
  const since = getPeriodStart(config.period);

  try {
    let rows: Record<string, unknown>[] = [];
    let headers: string[] = [];

    switch (report_type) {
      case 'performance': {
        const [dealsRes, socialRes, contentRes] = await Promise.all([
          supabase
            .from('deals')
            .select('id, name, value, status, created_at, actual_close_date')
            .gte('created_at', since)
            .limit(EXPORT_LIMIT),
          supabase
            .from('social_engagement')
            .select('likes, comments, shares, impressions, recorded_at')
            .gte('recorded_at', since)
            .limit(EXPORT_LIMIT),
          supabase
            .from('content_items')
            .select('id, status, created_at')
            .gte('created_at', since)
            .limit(EXPORT_LIMIT),
        ]);

        const deals = dealsRes.data ?? [];
        const engagement = socialRes.data ?? [];
        const content = contentRes.data ?? [];

        const wonDeals = deals.filter((d) => d.status === 'won');
        const openDeals = deals.filter((d) => d.status === 'open');
        const totalRevenue = wonDeals.reduce((s, d) => s + (d.value ?? 0), 0);
        const pipelineValue = openDeals.reduce((s, d) => s + (d.value ?? 0), 0);
        const totalEngagement =
          engagement.reduce((s, e) => s + (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0), 0);

        headers = ['metric', 'value'];
        const metricsMap: Record<string, unknown> = {
          revenue: totalRevenue,
          deals_won: wonDeals.length,
          pipeline_value: pipelineValue,
          conversion_rate:
            deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 10000) / 100 : 0,
          total_engagement: totalEngagement,
          content_count: content.length,
        };

        rows = config.metrics
          .filter((m) => m in metricsMap)
          .map((m) => ({ metric: m, value: metricsMap[m] }));
        break;
      }

      case 'content': {
        const { data } = await supabase
          .from('content_items')
          .select('id, title, status, content_type, category, created_at, updated_at')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(EXPORT_LIMIT);

        const items = data ?? [];
        headers = ['id', 'title', 'status', 'content_type', 'category', 'created_at'];

        const wantedMetrics = new Set(config.metrics);

        if (wantedMetrics.has('total_items') || wantedMetrics.has('published') || wantedMetrics.has('drafts')) {
          rows = items.map((item) => ({
            id: item.id,
            title: item.title,
            status: item.status,
            content_type: item.content_type,
            category: item.category,
            created_at: item.created_at,
          }));
        }

        if (wantedMetrics.has('by_type')) {
          const grouped: Record<string, number> = {};
          items.forEach((item) => {
            const t = item.content_type ?? 'unknown';
            grouped[t] = (grouped[t] ?? 0) + 1;
          });
          headers = ['content_type', 'count'];
          rows = Object.entries(grouped).map(([content_type, count]) => ({ content_type, count }));
        }

        if (wantedMetrics.has('by_category')) {
          const grouped: Record<string, number> = {};
          items.forEach((item) => {
            const c = item.category ?? 'uncategorized';
            grouped[c] = (grouped[c] ?? 0) + 1;
          });
          headers = ['category', 'count'];
          rows = Object.entries(grouped).map(([category, count]) => ({ category, count }));
        }
        break;
      }

      case 'social': {
        const { data } = await supabase
          .from('social_engagement')
          .select('likes, comments, shares, impressions, reach, clicks, recorded_at')
          .gte('recorded_at', since)
          .order('recorded_at', { ascending: false })
          .limit(EXPORT_LIMIT);

        const engagements = data ?? [];
        const selectedMetrics = config.metrics;
        const allCols = ['recorded_at', 'likes', 'comments', 'shares', 'impressions', 'reach', 'clicks'];

        headers = allCols.filter(
          (c) => c === 'recorded_at' || selectedMetrics.includes(c) || selectedMetrics.includes('engagement')
        );

        rows = engagements.map((e) => {
          const row: Record<string, unknown> = {};
          headers.forEach((h) => {
            row[h] = (e as Record<string, unknown>)[h] ?? 0;
          });
          return row;
        });
        break;
      }

      case 'seo': {
        const selectedMetrics = new Set(config.metrics);

        if (selectedMetrics.has('audit_score')) {
          const { data } = await supabase
            .from('seo_audits')
            .select('id, url, score, status, completed_at')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(20);

          headers = ['id', 'url', 'score', 'completed_at'];
          rows = (data ?? []).map((a) => ({
            id: a.id,
            url: a.url,
            score: a.score,
            completed_at: a.completed_at,
          }));
        }

        if (selectedMetrics.has('keyword_positions') || selectedMetrics.has('tracked_keywords')) {
          const { data } = await supabase
            .from('seo_keywords')
            .select('id, keyword, current_rank, previous_rank, status, updated_at')
            .eq('status', 'tracking')
            .order('updated_at', { ascending: false })
            .limit(EXPORT_LIMIT);

          headers = ['id', 'keyword', 'current_rank', 'previous_rank', 'status', 'updated_at'];
          rows = (data ?? []).map((k) => ({
            id: k.id,
            keyword: k.keyword,
            current_rank: k.current_rank,
            previous_rank: k.previous_rank,
            status: k.status,
            updated_at: k.updated_at,
          }));
        }
        break;
      }

      case 'custom': {
        const selectedMetrics = new Set(config.metrics);
        const summaryRows: Record<string, unknown>[] = [];
        headers = ['metric', 'value'];

        if (selectedMetrics.has('revenue') || selectedMetrics.has('deals_won') || selectedMetrics.has('pipeline_value')) {
          const { data } = await supabase
            .from('deals')
            .select('id, value, status')
            .gte('created_at', since)
            .limit(EXPORT_LIMIT);
          const deals = data ?? [];
          const wonDeals = deals.filter((d) => d.status === 'won');
          const openDeals = deals.filter((d) => d.status === 'open');

          if (selectedMetrics.has('revenue'))
            summaryRows.push({ metric: 'revenue', value: wonDeals.reduce((s, d) => s + (d.value ?? 0), 0) });
          if (selectedMetrics.has('deals_won'))
            summaryRows.push({ metric: 'deals_won', value: wonDeals.length });
          if (selectedMetrics.has('pipeline_value'))
            summaryRows.push({ metric: 'pipeline_value', value: openDeals.reduce((s, d) => s + (d.value ?? 0), 0) });
        }

        if (selectedMetrics.has('engagement') || selectedMetrics.has('impressions')) {
          const { data } = await supabase
            .from('social_engagement')
            .select('likes, comments, shares, impressions')
            .gte('recorded_at', since)
            .limit(EXPORT_LIMIT);
          const eng = data ?? [];

          if (selectedMetrics.has('engagement'))
            summaryRows.push({
              metric: 'engagement',
              value: eng.reduce((s, e) => s + (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0), 0),
            });
          if (selectedMetrics.has('impressions'))
            summaryRows.push({
              metric: 'impressions',
              value: eng.reduce((s, e) => s + (e.impressions ?? 0), 0),
            });
        }

        if (selectedMetrics.has('audit_score')) {
          const { data } = await supabase
            .from('seo_audits')
            .select('score')
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })
            .limit(1);
          summaryRows.push({ metric: 'audit_score', value: data?.[0]?.score ?? null });
        }

        if (selectedMetrics.has('tracked_keywords')) {
          const { data } = await supabase
            .from('seo_keywords')
            .select('id')
            .eq('status', 'tracking')
            .limit(EXPORT_LIMIT);
          summaryRows.push({ metric: 'tracked_keywords', value: data?.length ?? 0 });
        }

        if (selectedMetrics.has('total_items') || selectedMetrics.has('published')) {
          const { data } = await supabase
            .from('content_items')
            .select('id, status')
            .gte('created_at', since)
            .limit(EXPORT_LIMIT);
          const items = data ?? [];
          if (selectedMetrics.has('total_items'))
            summaryRows.push({ metric: 'total_items', value: items.length });
          if (selectedMetrics.has('published'))
            summaryRows.push({ metric: 'published', value: items.filter((i) => i.status === 'published').length });
        }

        rows = summaryRows;
        break;
      }

      default:
        return error(`Unknown report type: ${report_type}`, 400);
    }

    // ── Format and return ───────────────────────────────────────────
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `report-${report_type}-${timestamp}`;

    if (format === 'csv') {
      const csvLines: string[] = [headers.join(',')];
      rows.forEach((row) => {
        csvLines.push(
          headers
            .map((h) => {
              const val = row[h];
              if (val === null || val === undefined) return '';
              const str = String(val);
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str;
            })
            .join(',')
        );
      });

      return new NextResponse(csvLines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // JSON format
    return new NextResponse(JSON.stringify({ report_type, period: config.period, generated_at: new Date().toISOString(), data: rows }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.json"`,
      },
    });
  } catch (err) {
    console.error('Report export error:', err);
    return error('Failed to generate report export');
  }
}
