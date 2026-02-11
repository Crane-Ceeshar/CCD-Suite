import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createMilestoneSchema } from '@/lib/api/schemas/portal';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/portal/projects/:id/milestones
 * List milestones ordered by position.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('portal_milestones')
    .select('*')
    .eq('portal_project_id', id)
    .order('position', { ascending: true });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch milestones');
  }

  return success(data);
}

/**
 * POST /api/portal/projects/:id/milestones
 * Create a new milestone.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'portal:milestones:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createMilestoneSchema);
  if (bodyError) return bodyError;

  // Auto-position at end
  const { count: existingCount } = await supabase
    .from('portal_milestones')
    .select('id', { count: 'exact', head: true })
    .eq('portal_project_id', id);

  const { data, error: insertError } = await supabase
    .from('portal_milestones')
    .insert({
      portal_project_id: id,
      title: body.title,
      description: body.description ?? null,
      due_date: body.due_date ?? null,
      status: body.status,
      position: body.position ?? (existingCount ?? 0),
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create milestone');
  }

  // Recalculate project progress: (completed / total) * 100
  const { data: allMilestones } = await supabase
    .from('portal_milestones')
    .select('status')
    .eq('portal_project_id', id);

  if (allMilestones && allMilestones.length > 0) {
    const total = allMilestones.length;
    const completed = allMilestones.filter((m: { status: string }) => m.status === 'completed').length;
    const progress = Math.round((completed / total) * 100);

    await supabase
      .from('portal_projects')
      .update({ progress })
      .eq('id', id);
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_milestone.created',
    resource_type: 'portal_milestone',
    resource_id: data.id,
    details: { title: data.title, portal_project_id: id },
  });

  return success(data, 201);
}
