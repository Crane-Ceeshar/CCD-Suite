import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, dbError } from '@/lib/api/responses';

/**
 * GET /api/content/stats
 * Returns content dashboard statistics.
 */
export async function GET() {
  const { error: authError, supabase } = await requireAuth();
  if (authError) return authError;

  try {
    // Parallel count queries for each status — no full-table scan
    const [
      totalResult,
      draftResult,
      reviewResult,
      approvedResult,
      scheduledResult,
      publishedResult,
      archivedResult,
      typeCategoryResult,
      recentResult,
    ] = await Promise.all([
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'review'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('content_items')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'archived'),
      // Lightweight query for by_type / by_category aggregation
      supabase
        .from('content_items')
        .select('content_type, category_id'),
      // Recent content (last 5)
      supabase
        .from('content_items')
        .select(
          'id, title, status, content_type, created_at, category:content_categories(id, name, color)'
        )
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Check for errors on the count queries
    const firstError =
      totalResult.error ??
      draftResult.error ??
      reviewResult.error ??
      approvedResult.error ??
      scheduledResult.error ??
      publishedResult.error ??
      archivedResult.error ??
      typeCategoryResult.error;

    if (firstError) {
      return dbError(firstError, 'Failed to fetch content stats');
    }

    // By type
    const items = typeCategoryResult.data ?? [];
    const byType: Record<string, number> = {};
    for (const item of items) {
      byType[item.content_type] = (byType[item.content_type] ?? 0) + 1;
    }

    // By category
    const byCategory: Record<string, number> = {};
    for (const item of items) {
      const key = item.category_id ?? 'uncategorized';
      byCategory[key] = (byCategory[key] ?? 0) + 1;
    }

    return success({
      total: totalResult.count ?? 0,
      published: publishedResult.count ?? 0,
      scheduled: scheduledResult.count ?? 0,
      in_review: reviewResult.count ?? 0,
      drafts: draftResult.count ?? 0,
      archived: archivedResult.count ?? 0,
      by_type: byType,
      by_category: byCategory,
      recent: recentResult.data ?? [],
    });
  } catch (err) {
    console.error('Content stats error:', err);
    return error('Failed to fetch content stats');
  }
}
