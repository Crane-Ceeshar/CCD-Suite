import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createTaskSchema, taskListQuerySchema } from '@/lib/api/schemas/projects';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/projects/:id/tasks
 * List tasks with filtering, sorting, and pagination.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id: projectId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'tasks:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    taskListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, priority, assigned_to, label, sprint_id, parent_id, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('tasks')
    .select('*', { count: 'exact' })
    .eq('project_id', projectId)
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) {
    const statuses = status.split(',').map((s: string) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      dbQuery = dbQuery.eq('status', statuses[0]);
    } else if (statuses.length > 1) {
      dbQuery = dbQuery.in('status', statuses);
    }
  }
  if (priority) dbQuery = dbQuery.eq('priority', priority);
  if (assigned_to) dbQuery = dbQuery.eq('assigned_to', assigned_to);
  if (sprint_id) dbQuery = dbQuery.eq('sprint_id', sprint_id);
  if (parent_id) {
    dbQuery = dbQuery.eq('parent_id', parent_id);
  } else {
    // By default show only top-level tasks
    dbQuery = dbQuery.is('parent_id', null);
  }
  if (label) dbQuery = dbQuery.contains('labels', [label]);
  if (search) {
    dbQuery = dbQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch tasks');
  }

  // Fetch subtask counts
  if (data && data.length > 0) {
    const taskIds = data.map((t: { id: string }) => t.id);
    const { data: subtaskCounts } = await supabase
      .from('tasks')
      .select('parent_id')
      .in('parent_id', taskIds);

    const countMap = new Map<string, number>();
    (subtaskCounts ?? []).forEach((s: { parent_id: string }) => {
      countMap.set(s.parent_id, (countMap.get(s.parent_id) ?? 0) + 1);
    });

    data.forEach((task: { id: string; subtask_count?: number }) => {
      task.subtask_count = countMap.get(task.id) ?? 0;
    });
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/projects/:id/tasks
 * Create a new task.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id: projectId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'tasks:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createTaskSchema);
  if (bodyError) return bodyError;

  // Get the next position for this status column
  const { count: existingCount } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)
    .eq('status', body.status);

  const { data, error: insertError } = await supabase
    .from('tasks')
    .insert({
      tenant_id: profile.tenant_id,
      project_id: projectId,
      title: body.title,
      description: body.description ?? null,
      status: body.status,
      priority: body.priority,
      due_date: body.due_date ?? null,
      start_date: body.start_date ?? null,
      estimated_hours: body.estimated_hours ?? null,
      assigned_to: body.assigned_to ?? null,
      parent_id: body.parent_id ?? null,
      labels: body.labels,
      story_points: body.story_points ?? null,
      sprint_id: body.sprint_id ?? null,
      position: existingCount ?? 0,
      metadata: body.metadata,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create task');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'task.created',
    resource_type: 'task',
    resource_id: data.id,
    details: { title: data.title, project_id: projectId },
  });

  return success(data, 201);
}
