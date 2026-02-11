import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/portal/notifications
 * Get portal notifications for the current user.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '20', 10);
  const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';

  let q = supabase
    .from('portal_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    q = q.eq('is_read', false);
  }

  const { data, error: queryError } = await q;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch notifications');
  }

  return success(data);
}

/**
 * PATCH /api/portal/notifications
 * Mark notifications as read. Pass `ids` array or `all=true` to mark all.
 */
export async function PATCH(request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const body = await request.json() as { ids?: string[]; all?: boolean };

  if (body.all) {
    const { error: updateError } = await supabase
      .from('portal_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (updateError) {
      return dbError(updateError, 'Failed to mark notifications as read');
    }
  } else if (body.ids && body.ids.length > 0) {
    const { error: updateError } = await supabase
      .from('portal_notifications')
      .update({ is_read: true })
      .in('id', body.ids);

    if (updateError) {
      return dbError(updateError, 'Failed to mark notifications as read');
    }
  }

  return success({ updated: true });
}
