import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { syncAllAnalytics } from '@/lib/services/social-analytics-sync';
import { syncAllComments } from '@/lib/services/social-comments-sync';
import { isConfigured } from '@/lib/services/ayrshare';

/**
 * POST /api/social/analytics/sync
 * Triggers a full analytics + comments sync from Ayrshare for all published posts.
 */
export async function POST() {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  if (!isConfigured()) {
    return NextResponse.json(
      { success: false, error: { message: 'Ayrshare is not configured' } },
      { status: 503 }
    );
  }

  try {
    // Sync analytics and comments in parallel
    const [analyticsResult, commentsResult] = await Promise.all([
      syncAllAnalytics(supabase, profile.tenant_id),
      syncAllComments(supabase, profile.tenant_id),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        analytics: {
          total_posts: analyticsResult.total,
          synced: analyticsResult.synced,
          errors: analyticsResult.errors.length,
        },
        comments: {
          total_posts: commentsResult.total,
          new_comments: commentsResult.synced,
          errors: commentsResult.errors.length,
        },
        synced_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Sync failed' } },
      { status: 500 }
    );
  }
}
