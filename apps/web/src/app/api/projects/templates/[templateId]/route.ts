import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, notFound, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

const createFromTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).nullable().optional(),
});

/**
 * GET /api/projects/templates/:templateId
 * Get a single template (project) with its task list for preview.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { error: authError, supabase, user } = await requireAuth();
  if (authError) return authError;

  const { templateId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'project-templates:get' });
  if (limited) return limitResp!;

  // Fetch the template project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, description, budget, currency, status')
    .eq('id', templateId)
    .single();

  if (projectError) {
    return dbError(projectError, 'Template project');
  }

  if (!project) {
    return notFound('Template project');
  }

  // Fetch tasks for preview
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id, title, description, priority, labels, estimated_hours, position, story_points')
    .eq('project_id', templateId)
    .order('position', { ascending: true });

  if (tasksError) {
    return dbError(tasksError, 'Failed to fetch template tasks');
  }

  return success({
    id: project.id,
    name: project.name,
    description: project.description,
    budget: project.budget,
    currency: project.currency,
    status: project.status,
    task_count: tasks?.length ?? 0,
    tasks: tasks ?? [],
  });
}

/**
 * POST /api/projects/templates/:templateId
 * Instantiate a new project from this template.
 * Same behavior as POST /api/projects/templates but template_project_id comes from the URL.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { templateId } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'project-templates:instantiate' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createFromTemplateSchema);
  if (bodyError) return bodyError;

  // 1. Fetch the template project
  const { data: templateProject, error: templateError } = await supabase
    .from('projects')
    .select('id, name, budget, currency')
    .eq('id', templateId)
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
    .eq('project_id', templateId)
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
      console.error('Failed to copy template tasks:', insertTasksError);
    }
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.created_from_template',
    resource_type: 'project',
    resource_id: newProject.id,
    details: {
      template_project_id: templateId,
      template_name: templateProject.name,
      name: body.name,
      tasks_copied: templateTasks?.length ?? 0,
    },
  });

  return success(newProject, 201);
}
