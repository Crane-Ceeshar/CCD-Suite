import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';

export async function projectsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('projects'));

  // List projects
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('projects')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get project with tasks
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('projects')
      .select('*, tasks(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create project
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('projects')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId, owner_id: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update project
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id', async (request) => {
      const { data, error } = await fastify.supabase
        .from('projects')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Delete project
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('projects')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });

  // --- Task routes ---

  // Get tasks for project (board view)
  fastify.get<{ Params: { id: string } }>('/:id/tasks', async (request) => {
    const { data, error } = await fastify.supabase
      .from('tasks')
      .select('*')
      .eq('project_id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .order('position');

    if (error) throw error;
    return { success: true, data };
  });

  // Create task
  fastify.post<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id/tasks', async (request) => {
      const { data, error } = await fastify.supabase
        .from('tasks')
        .insert({ ...request.body, project_id: request.params.id, tenant_id: request.tenantId, created_by: request.userId })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Update task
  fastify.patch<{ Params: { id: string; taskId: string }; Body: Record<string, unknown> }>(
    '/:id/tasks/:taskId', async (request) => {
      const { data, error } = await fastify.supabase
        .from('tasks')
        .update(request.body)
        .eq('id', request.params.taskId)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Delete task
  fastify.delete<{ Params: { id: string; taskId: string } }>(
    '/:id/tasks/:taskId', async (request) => {
      const { error } = await fastify.supabase
        .from('tasks')
        .delete()
        .eq('id', request.params.taskId)
        .eq('tenant_id', request.tenantId);

      if (error) throw error;
      return { success: true };
    }
  );

  // --- Time entry routes ---

  // Start timer
  fastify.post<{ Params: { id: string; taskId: string }; Body: { description?: string } }>(
    '/:id/tasks/:taskId/time', async (request) => {
      const { data, error } = await fastify.supabase
        .from('time_entries')
        .insert({
          task_id: request.params.taskId,
          tenant_id: request.tenantId,
          user_id: request.userId,
          started_at: new Date().toISOString(),
          is_running: true,
          description: request.body.description,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Stop timer
  fastify.patch<{ Params: { id: string; taskId: string; timeId: string } }>(
    '/:id/tasks/:taskId/time/:timeId/stop', async (request) => {
      const now = new Date();
      const { data: entry } = await fastify.supabase
        .from('time_entries')
        .select('started_at')
        .eq('id', request.params.timeId)
        .single();

      const durationMinutes = entry
        ? Math.round((now.getTime() - new Date(entry.started_at).getTime()) / 60000)
        : 0;

      const { data, error } = await fastify.supabase
        .from('time_entries')
        .update({
          ended_at: now.toISOString(),
          duration_minutes: durationMinutes,
          is_running: false,
        })
        .eq('id', request.params.timeId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );
}
