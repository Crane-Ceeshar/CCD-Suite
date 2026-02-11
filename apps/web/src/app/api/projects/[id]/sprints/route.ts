import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createSprintSchema } from '@/lib/api/schemas/projects';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/projects/:id/sprints
 * List sprints with task counts and story point totals.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: sprints, error: queryError } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch sprints');
  }

  // Enrich with task counts
  const enriched = await Promise.all(
    (sprints ?? []).map(async (sprint: { id: string }) => {
      const [totalRes, completedRes, pointsRes, completedPointsRes] = await Promise.all([
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('sprint_id', sprint.id),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('sprint_id', sprint.id).eq('status', 'done'),
        supabase.from('tasks').select('story_points').eq('sprint_id', sprint.id).not('story_points', 'is', null),
        supabase.from('tasks').select('story_points').eq('sprint_id', sprint.id).eq('status', 'done').not('story_points', 'is', null),
      ]);

      const totalPoints = (pointsRes.data ?? []).reduce((sum: number, t: { story_points: number | null }) => sum + (t.story_points ?? 0), 0);
      const completedPoints = (completedPointsRes.data ?? []).reduce((sum: number, t: { story_points: number | null }) => sum + (t.story_points ?? 0), 0);

      return {
        ...sprint,
        task_count: totalRes.count ?? 0,
        completed_task_count: completedRes.count ?? 0,
        total_points: totalPoints,
        completed_points: completedPoints,
      };
    })
  );

  return success(enriched);
}

/**
 * POST /api/projects/:id/sprints
 * Create a new sprint.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'sprints:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createSprintSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('sprints')
    .insert({
      tenant_id: profile.tenant_id,
      project_id: id,
      name: body.name,
      goal: body.goal ?? null,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      capacity_points: body.capacity_points ?? null,
      status: 'planning',
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create sprint');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'sprint.created',
    resource_type: 'sprint',
    resource_id: data.id,
    details: { name: data.name, project_id: id },
  });

  return success(data, 201);
}
