import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createProjectMemberSchema } from '@/lib/api/schemas/projects';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/projects/:id/members
 * List all members of a project with profile info.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('project_members')
    .select('id, user_id, role, created_at, profile:profiles(id, full_name, email, avatar_url)')
    .eq('project_id', id)
    .order('created_at', { ascending: true });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch members');
  }

  return success(data);
}

/**
 * POST /api/projects/:id/members
 * Add a member to a project.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'projects:members:add' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createProjectMemberSchema);
  if (bodyError) return bodyError;

  // Check for duplicate membership
  const { data: existing } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', id)
    .eq('user_id', body.user_id)
    .maybeSingle();

  if (existing) {
    return errorResponse('User is already a member of this project', 409);
  }

  const { data, error: insertError } = await supabase
    .from('project_members')
    .insert({
      tenant_id: profile.tenant_id,
      project_id: id,
      user_id: body.user_id,
      role: body.role,
    })
    .select('id, user_id, role, created_at, profile:profiles(id, full_name, email, avatar_url)')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to add member');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.member_added',
    resource_type: 'project_member',
    resource_id: data.id,
    details: { project_id: id, user_id: body.user_id, role: body.role },
  });

  return success(data, 201);
}
