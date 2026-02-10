import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, error } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { commentUpdateSchema } from '@/lib/api/schemas/content';

/**
 * PATCH /api/content/:id/comments/:commentId
 * Edit or resolve a comment. Only the author can edit; any team member can resolve.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { id, commentId } = await params;

  const { data: body, error: bodyError } = await validateBody(request, commentUpdateSchema);
  if (bodyError) return bodyError;

  // Fetch existing comment
  const { data: existing, error: fetchError } = await supabase
    .from('content_comments')
    .select('id, author_id, content_item_id')
    .eq('id', commentId)
    .eq('content_item_id', id)
    .single();

  if (fetchError) return dbError(fetchError, 'Comment');

  // Only the author can edit the body
  if (body.body !== undefined && existing.author_id !== user.id) {
    return error('You can only edit your own comments', 403);
  }

  const updateFields: Record<string, unknown> = {};
  if (body.body !== undefined) updateFields.body = body.body;
  if (body.resolved !== undefined) updateFields.resolved = body.resolved;
  updateFields.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('content_comments')
    .update(updateFields)
    .eq('id', commentId)
    .select('*')
    .single();

  if (updateError) return dbError(updateError, 'Comment');

  return success(updated);
}

/**
 * DELETE /api/content/:id/comments/:commentId
 * Delete a comment. Only the author can delete.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { id, commentId } = await params;

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('content_comments')
    .select('id, author_id')
    .eq('id', commentId)
    .eq('content_item_id', id)
    .single();

  if (fetchError) return dbError(fetchError, 'Comment');

  if (existing.author_id !== user.id) {
    return error('You can only delete your own comments', 403);
  }

  // Delete replies first, then the comment itself
  await supabase.from('content_comments').delete().eq('parent_id', commentId);
  const { error: deleteError } = await supabase
    .from('content_comments')
    .delete()
    .eq('id', commentId);

  if (deleteError) return dbError(deleteError, 'Comment');

  return success({ deleted: true });
}
