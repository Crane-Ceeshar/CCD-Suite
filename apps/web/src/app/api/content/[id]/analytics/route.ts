import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { contentAnalyticsQuerySchema } from '@/lib/api/schemas/media';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/content/:id/analytics
 * Fetch content analytics for a specific content item.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'content:analytics' });
  if (limited) return limitResp!;

  const { data: query, error: qErr } = validateQuery(
    request.nextUrl.searchParams,
    contentAnalyticsQuerySchema
  );
  if (qErr) return qErr;

  const { period } = query!;

  // Parse period string (e.g. '7d', '30d', '90d') into a start date
  const daysMatch = period.match(/^(\d+)d$/);
  const days = daysMatch ? parseInt(daysMatch[1], 10) : 30;
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - days);

  const { data, error: queryErr } = await supabase
    .from('content_analytics')
    .select('*')
    .eq('content_item_id', id)
    .eq('tenant_id', profile.tenant_id)
    .gte('recorded_at', periodStart.toISOString())
    .order('recorded_at', { ascending: true });

  if (queryErr) return dbError(queryErr, 'Failed to fetch content analytics');

  // Return empty structure if no data
  if (!data || data.length === 0) {
    return success({
      items: [],
      summary: {
        views: 0,
        unique_views: 0,
        avg_time_seconds: 0,
        engagement_score: 0,
        bounce_rate: 0,
      },
    });
  }

  // Compute summary by aggregating across all records
  const summary = {
    views: data.reduce((sum, r) => sum + (r.views ?? 0), 0),
    unique_views: data.reduce((sum, r) => sum + (r.unique_views ?? 0), 0),
    avg_time_seconds:
      data.reduce((sum, r) => sum + (r.avg_time_seconds ?? 0), 0) / data.length,
    engagement_score:
      data.reduce((sum, r) => sum + (r.engagement_score ?? 0), 0) / data.length,
    bounce_rate:
      data.reduce((sum, r) => sum + (r.bounce_rate ?? 0), 0) / data.length,
  };

  return success({ items: data, summary });
}
