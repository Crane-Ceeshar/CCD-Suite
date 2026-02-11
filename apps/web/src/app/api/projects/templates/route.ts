import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, notFound, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

const createFromTemplateSchema = z.object({
  template_project_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
});

/**
 * GET /api/projects/templates
 * List active projects that have tasks, formatted as available templates.
 * Returns: { id, name, description, task_count }[]
 */
export async function GET(request: NextRequest) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'project-templates:list' });
  if (limited) return limitResp!;

  // Fetch active projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name, description')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (projectsError) {
    return dbError(projectsError, 'Failed to fetch templates');
  }

  if (!projects || projects.length === 0) {
    return success([]);
  }

  // Get task counts for each project
  const projectIds = projects.map((p: { id: string }) => p.id);
  const { data: taskCounts, error: taskError } = await supabase
    .from('tasks')
    .select('project_id')
    .in('project_id', projectIds);

  if (taskError) {
    return dbError(taskError, 'Failed to fetch task counts');
  }

  // Build count map
  const countMap = new Map<string, number>();
  (taskCounts ?? []).forEach((t: { project_id: string }) => {
    countMap.set(t.project_id, (countMap.get(t.project_id) ?? 0) + 1);
  });

  // Only include projects that have at least one task
  const templates = projects
    .filter((p: { id: string }) => (countMap.get(p.id) ?? 0) > 0)
    .map((p: { id: string; name: string; description: string | null }) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      task_count: countMap.get(p.id) ?? 0,
    }));

  return success(templates);
}

/**
 * POST /api/projects/templates
 * Create a new project from a template project.
 * Copies tasks (title, description, priority, labels, estimated_hours, position, story_points).
 * Resets status to 'todo'. Does NOT copy time entries, sprint assignments, or member assignments.
 */
export async function POST(request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'project-templates:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createFromTemplateSchema);
  if (bodyError) return bodyError;

  // 1. Fetch the template project
  const { data: templateProject, error: templateError } = await supabase
    .from('projects')
    .select('id, name, budget, currency')
    .eq('id', body.template_project_id)
    .single();

  if (templateError) {
    return dbError(templateError, 'Template project');
  }

  if (!templateProject) {
    return notFound('Template project');
  }

  // 2. Fetch tasks from the template project
  const { data: templateTasks, error: tasksError } = await supabase
    .from('tasks')
    .select('title, description, priority, labels, estimated_hours, position, story_points')
    .eq('project_id', body.template_project_id)
    .order('position', { ascending: true });

  if (tasksError) {
    return dbError(tasksError, 'Failed to fetch template tasks');
  }

  // 3. Create the new project
  const { data: newProject, error: createError } = await supabase
    .from('projects')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      budget: templateProject.budget,
      currency: templateProject.currency,
      status: 'active',
      priority: 'medium',
      created_by: user.id,
    })
    .select()
    .single();

  if (createError) {
    return dbError(createError, 'Failed to create project from template');
  }

  // Auto-add creator as owner
  await supabase.from('project_members').insert({
    project_id: newProject.id,
    user_id: user.id,
    role: 'owner',
  });

  // 4. Copy tasks into the new project (reset status to 'todo')
  if (templateTasks && templateTasks.length > 0) {
    const newTasks = templateTasks.map((task: {
      title: string;
      description: string | null;
      priority: string;
      labels: string[];
      estimated_hours: number | null;
      position: number;
      story_points: number | null;
    }) => ({
      tenant_id: profile.tenant_id,
      project_id: newProject.id,
      title: task.title,
      description: task.description,
      status: 'todo',
      priority: task.priority,
      labels: task.labels,
      estimated_hours: task.estimated_hours,
      position: task.position,
      story_points: task.story_points,
      created_by: user.id,
    }));

    const { error: insertTasksError } = await supabase
      .from('tasks')
      .insert(newTasks);

    if (insertTasksError) {
      // Project was created but tasks failed — log but don't fail the whole request
      console.error('Failed to copy template tasks:', insertTasksError);
    }
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.created_from_template',
    resource_type: 'project',
    resource_id: newProject.id,
    details: {
      template_project_id: body.template_project_id,
      template_name: templateProject.name,
      name: body.name,
      tasks_copied: templateTasks?.length ?? 0,
    },
  });

  return success(newProject, 201);
}
