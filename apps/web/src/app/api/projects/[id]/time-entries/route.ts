import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createTimeEntrySchema, timeEntryListQuerySchema } from '@/lib/api/schemas/projects';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/projects/:id/time-entries
 * List time entries for a project (via tasks).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: query, error: queryError } = validateQuery(request.nextUrl.searchParams, timeEntryListQuerySchema);
  if (queryError) return queryError;

  // Get tasks for this project (id + title for enrichment)
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('project_id', id);

  const taskIds = (tasks ?? []).map((t: { id: string }) => t.id);
  const taskMap = new Map((tasks ?? []).map((t: { id: string; title: string }) => [t.id, t]));

  if (taskIds.length === 0) {
    return success([]);
  }

  let q = supabase
    .from('time_entries')
    .select('*')
    .in('task_id', taskIds)
    .order('started_at', { ascending: false })
    .range(query.offset, query.offset + query.limit - 1);

  if (query.task_id) q = q.eq('task_id', query.task_id);
  if (query.user_id) q = q.eq('user_id', query.user_id);
  if (query.from) q = q.gte('started_at', query.from);
  if (query.to) q = q.lte('started_at', query.to);
  if (query.billable === 'true') q = q.eq('billable', true);
  if (query.billable === 'false') q = q.eq('billable', false);

  const { data, error: fetchError } = await q;

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch time entries');
  }

  // Enrich with task and profile info
  const userIds = [...new Set((data ?? []).map((e: { user_id: string }) => e.user_id))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p: { id: string; full_name: string | null; avatar_url: string | null }) => [p.id, p]));

  const enriched = (data ?? []).map((entry: { task_id: string; user_id: string }) => {
    const task = taskMap.get(entry.task_id);
    const profile = profileMap.get(entry.user_id);
    return {
      ...entry,
      task: task ? { id: task.id, title: task.title, project_id: id } : undefined,
      profile: profile ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
    };
  });

  return success(enriched);
}

/**
 * POST /api/projects/:id/time-entries
 * Create a time entry (manual or start timer).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'time-entries:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createTimeEntrySchema);
  if (bodyError) return bodyError;

  // Verify task belongs to this project
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('id, title')
    .eq('id', body.task_id)
    .eq('project_id', id)
    .single();

  if (taskError || !task) {
    return errorResponse('Task not found in this project', 404);
  }

  // If starting a running timer, check no other timer is running
  if (body.is_running) {
    const { data: existing } = await supabase
      .from('time_entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_running', true)
      .limit(1);

    if (existing && existing.length > 0) {
      return errorResponse('You already have a running timer. Stop it before starting a new one.', 409);
    }
  }

  // Calculate duration if start+end provided and not running
  let durationMinutes = body.duration_minutes;
  if (!body.is_running && body.ended_at && !durationMinutes) {
    const start = new Date(body.started_at).getTime();
    const end = new Date(body.ended_at).getTime();
    durationMinutes = Math.round((end - start) / 60000);
  }

  const { data, error: insertError } = await supabase
    .from('time_entries')
    .insert({
      tenant_id: profile.tenant_id,
      task_id: body.task_id,
      user_id: user.id,
      description: body.description ?? null,
      started_at: body.started_at,
      ended_at: body.ended_at ?? null,
      duration_minutes: durationMinutes ?? null,
      is_running: body.is_running,
      billable: body.billable,
      hourly_rate: body.hourly_rate ?? null,
    })
    .select('*')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create time entry');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'time_entry.created',
    resource_type: 'time_entry',
    resource_id: data.id,
    details: { task_id: body.task_id, is_running: body.is_running, project_id: id },
  });

  // Enrich response with task and profile info
  const enriched = {
    ...data,
    task: { id: task.id, title: (task as { id: string; title: string }).title, project_id: id },
    profile: { id: user.id, full_name: profile.full_name ?? null, avatar_url: null },
  };

  return success(enriched, 201);
}
