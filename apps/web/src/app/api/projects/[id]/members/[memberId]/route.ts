import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateProjectMemberSchema } from '@/lib/api/schemas/projects';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * PATCH /api/projects/:id/members/:memberId
 * Update a member's role.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, memberId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'projects:members:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateProjectMemberSchema);
  if (bodyError) return bodyError;

  const { data, error: updateError } = await supabase
    .from('project_members')
    .update({ role: body.role })
    .eq('id', memberId)
    .eq('project_id', id)
    .select('id, user_id, role, created_at, profile:profiles(id, full_name, email, avatar_url)')
    .single();

  if (updateError) {
    return dbError(updateError, 'Project member');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.member_updated',
    resource_type: 'project_member',
    resource_id: memberId,
    details: { project_id: id, role: body.role },
  });

  return success(data);
}

/**
 * DELETE /api/projects/:id/members/:memberId
 * Remove a member from a project. Owners cannot be removed.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id, memberId } = await params;

  // Check if member is an owner — owners cannot be removed
  const { data: member, error: fetchError } = await supabase
    .from('project_members')
    .select('id, user_id, role')
    .eq('id', memberId)
    .eq('project_id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Project member');
  }

  if (member.role === 'owner') {
    return errorResponse('Cannot remove the project owner', 400);
  }

  const { error: deleteError } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)
    .eq('project_id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to remove member');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.member_removed',
    resource_type: 'project_member',
    resource_id: memberId,
    details: { project_id: id, user_id: member.user_id },
  });

  return success({ deleted: true });
}
