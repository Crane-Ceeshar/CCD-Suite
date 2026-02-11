import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { logAudit } from '@/lib/api/audit';

/**
 * DELETE /api/portal/projects/:id/messages/:messageId
 * Delete own message only.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, messageId } = await params;

  // Verify the message belongs to the user
  const { data: message, error: fetchError } = await supabase
    .from('portal_messages')
    .select('id, sender_id')
    .eq('id', messageId)
    .eq('portal_project_id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Message');
  }

  if (message.sender_id !== user.id) {
    return errorResponse('You can only delete your own messages', 403);
  }

  const { error: deleteError } = await supabase
    .from('portal_messages')
    .delete()
    .eq('id', messageId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete message');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_message.deleted',
    resource_type: 'portal_message',
    resource_id: messageId,
    details: { portal_project_id: id },
  });

  return success({ deleted: true });
}
