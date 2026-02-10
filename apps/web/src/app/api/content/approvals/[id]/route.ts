import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError, error } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { createNotification } from '@/lib/api/activity';
import { approvalActionSchema } from '@/lib/api/schemas/content';
import { checkContentPermission } from '@/lib/api/permissions';

/**
 * PATCH /api/content/approvals/:id
 * Take action on an approval: approve, reject, or request changes.
 * Body: { action: 'approve' | 'reject' | 'request_changes', comments?: string }
 *
 * Validations:
 *   - The current user must be the assigned reviewer
 *   - The approval must be in 'pending' status
 *   - Sets reviewed_at timestamp on approve/reject
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { id } = await params;

  // reviewer+ can approve/reject
  const perm = await checkContentPermission(supabase, user.id, profile.tenant_id, 'reviewer');
  if (!perm.allowed) return perm.error!;

  const { data: body, error: bodyError } = await validateBody(request, approvalActionSchema);
  if (bodyError) return bodyError;

  const { action, comments } = body;

  // Fetch the existing approval to validate state
  const { data: existing, error: fetchError } = await supabase
    .from('content_approvals')
    .select('id, status, reviewer_id')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Approval');
  }

  // Validate reviewer_id matches current user
  if (existing.reviewer_id && existing.reviewer_id !== user.id) {
    return error('You are not the assigned reviewer for this approval', 403);
  }

  // Prevent actions on non-pending approvals
  if (existing.status !== 'pending') {
    return error(
      `Cannot ${action} an approval that is already ${existing.status}`,
      409
    );
  }

  // Map action to approval status
  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    request_changes: 'changes_requested',
  };

  // Map action to content item status
  const contentStatusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'draft',
    request_changes: 'draft',
  };

  // Build update payload — set reviewed_at on approve/reject
  const updatePayload: Record<string, unknown> = {
    status: statusMap[action],
    comments: comments ?? null,
  };

  if (action === 'approve' || action === 'reject') {
    updatePayload.reviewed_at = new Date().toISOString();
  }

  // Update the approval record
  const { data: approval, error: updateError } = await supabase
    .from('content_approvals')
    .update(updatePayload)
    .eq('id', id)
    .select('*, content_item:content_items(id, title, content_type, status, created_by)')
    .single();

  if (updateError) {
    return dbError(updateError, 'Approval');
  }

  // Update the content item status
  if (approval?.content_item_id) {
    const { error: contentUpdateError } = await supabase
      .from('content_items')
      .update({ status: contentStatusMap[action] })
      .eq('id', approval.content_item_id);

    if (contentUpdateError) {
      return dbError(contentUpdateError, 'Failed to update content status');
    }
  }

  // Fire-and-forget audit log
  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'content.approval.' + action,
    resource_type: 'content_approval',
    resource_id: id,
    details: { action, content_item_id: approval?.content_item_id },
  });

  // Notify content author
  if (approval?.content_item?.created_by && approval.content_item.created_by !== user.id) {
    createNotification(supabase, profile.tenant_id, {
      user_id: approval.content_item.created_by,
      type: action === 'approve' ? 'success' : 'warning',
      title: `Content ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs changes'}: ${approval.content_item.title}`,
      message: comments || undefined,
      link: `/content/editor?id=${approval.content_item.id}`,
      module: 'content',
    });
  }

  return success(approval);
}
