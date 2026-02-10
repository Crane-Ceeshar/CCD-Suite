import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { calendarQuerySchema } from '@/lib/api/schemas/content';

/**
 * GET /api/content/calendar
 * Content items with publish_date in a date range.
 * Query params: from, to (ISO date strings)
 */
export async function GET(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    calendarQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { data, error: queryError } = await supabase
    .from('content_items')
    .select('id, title, content_type, status, publish_date, category:content_categories(id, name, color)')
    .not('publish_date', 'is', null)
    .gte('publish_date', query!.from)
    .lte('publish_date', query!.to)
    .order('publish_date', { ascending: true });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch calendar items');
  }

  return success(data);
}
