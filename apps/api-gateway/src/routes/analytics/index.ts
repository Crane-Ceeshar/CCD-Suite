import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';

export async function analyticsRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('analytics'));

  // List dashboards
  fastify.get('/dashboards', async (request) => {
    const { data, error } = await fastify.supabase
      .from('dashboards')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at');

    if (error) throw error;
    return { success: true, data };
  });

  // Get dashboard with widgets
  fastify.get<{ Params: { id: string } }>('/dashboards/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('dashboards')
      .select('*, widgets(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Dashboard not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create dashboard
  fastify.post<{ Body: Record<string, unknown> }>('/dashboards', async (request) => {
    const { data, error } = await fastify.supabase
      .from('dashboards')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update dashboard
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/dashboards/:id', async (request) => {
      const { data, error } = await fastify.supabase
        .from('dashboards')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Widget CRUD
  fastify.post<{ Body: Record<string, unknown> }>('/widgets', async (request) => {
    const { data, error } = await fastify.supabase
      .from('widgets')
      .insert(request.body)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/widgets/:id', async (request) => {
      const { data, error } = await fastify.supabase
        .from('widgets')
        .update(request.body)
        .eq('id', request.params.id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  fastify.delete<{ Params: { id: string } }>('/widgets/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('widgets')
      .delete()
      .eq('id', request.params.id);

    if (error) throw error;
    return { success: true };
  });

  // Metrics aggregation
  fastify.get<{ Querystring: { module?: string; start?: string; end?: string } }>(
    '/metrics', async (request) => {
      let query = fastify.supabase
        .from('metrics')
        .select('*')
        .eq('tenant_id', request.tenantId)
        .order('recorded_at', { ascending: false })
        .limit(1000);

      if (request.query.module) query = query.eq('module', request.query.module);
      if (request.query.start) query = query.gte('recorded_at', request.query.start);
      if (request.query.end) query = query.lte('recorded_at', request.query.end);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    }
  );
}
