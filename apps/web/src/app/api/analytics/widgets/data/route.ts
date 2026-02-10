import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { z } from 'zod';
import { fetchWidgetData } from '@/lib/analytics/widget-data-fetcher';

const widgetDataQuerySchema = z.object({
  data_source: z.string().min(1, 'data_source is required'),
  period: z.enum(['7d', '30d', '90d', 'ytd']).default('30d'),
  widget_type: z.string().default('stat_card'),
});

/**
 * GET /api/analytics/widgets/data
 * Fetch real data for a dashboard widget based on its data_source.
 * Query params: ?data_source=crm.revenue&period=30d&widget_type=line_chart
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    widgetDataQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  try {
    const result = await fetchWidgetData(
      supabase,
      query!.data_source,
      {},
      query!.period
    );

    const response = success({
      data_source: query!.data_source,
      period: query!.period,
      widget_type: query!.widget_type,
      ...result,
    });
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (err) {
    console.error('Widget data fetch error:', err);
    return error('Failed to fetch widget data');
  }
}
