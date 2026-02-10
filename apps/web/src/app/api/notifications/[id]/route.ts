import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * PATCH /api/notifications/:id
 * Mark a single notification as read.
 */
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const now = new Date().toISOString();

  const { data, error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: now })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Notification');
  }

  return success(data);
}

/**
 * DELETE /api/notifications/:id
 * Delete a single notification.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

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