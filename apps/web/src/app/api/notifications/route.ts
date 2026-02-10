import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, dbError } from '@/lib/api/responses';
import { validateQuery, validateBody } from '@/lib/api/validate';
import {
  notificationListQuerySchema,
  notificationUpdateSchema,
} from '@/lib/api/schemas/notifications';

/**
 * GET /api/notifications
 * List notifications for the current user with pagination.
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { data: query, error: queryError } = validateQuery(
    request.nextUrl.searchParams,
    notificationListQuerySchema
  );
  if (queryError) return queryError;

  const { page, limit, unread_only } = query;
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (unread_only) {
    dbQuery = dbQuery.eq('is_read', false);
  }

  const { data, error: fetchError, count } = await dbQuery;

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch notifications');
  }

  return success({
    notifications: data ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}

/**
 * PATCH /api/notifications
 * Mark one or all notifications as read.
 */
export async function PATCH(request: NextRequest) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { data: body, error: bodyError } = await validateBody(request, notificationUpdateSchema);
  if (bodyError) return bodyError;

  const now = new Date().toISOString();

  if (body.mark_all_read) {
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (updateError) {
      return dbError(updateError, 'Failed to mark notifications as read');
    }

    return success({ marked_all_read: true });
  }

  if (body.id) {
    const { data, error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: now })
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return dbError(updateError, 'Notification');
    }

    return success(data);
  }

  return error('Provide id or mark_all_read', 400);
}

/**
 * DELETE /api/notifications
 * Delete a single notification.
 */
export async function DELETE(request: NextRequest) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const id = request.nextUrl.searchParams.get('id');
  if (!id) {
    return error('id query param is required', 400);
  }

  const { error: deleteError } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete notification');
  }

  return success({ deleted: true });
}
