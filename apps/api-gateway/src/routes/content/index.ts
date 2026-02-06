import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middleware/auth.js';
import { requireModule } from '../../middleware/require-module.js';

export async function contentRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', requireAuth);
  fastify.addHook('preHandler', requireModule('content'));

  // List content items
  fastify.get('/items', async (request) => {
    const { data, error } = await fastify.supabase
      .from('content_items')
      .select('*, category:content_categories(id, name, color)')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get content item by ID
  fastify.get<{ Params: { id: string } }>('/items/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('content_items')
      .select('*, category:content_categories(*), assets:content_assets(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Content not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create content item
  fastify.post<{ Body: Record<string, unknown> }>('/items', async (request) => {
    const { data, error } = await fastify.supabase
      .from('content_items')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId, author_id: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update content item
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/items/:id', async (request) => {
      const { data, error } = await fastify.supabase
        .from('content_items')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    }
  );

  // Delete content item
  fastify.delete<{ Params: { id: string } }>('/items/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('content_items')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });

  // Calendar view (items with publish dates in range)
  fastify.get<{ Querystring: { start: string; end: string } }>('/calendar', async (request) => {
    const { data, error } = await fastify.supabase
      .from('content_items')
      .select('*, category:content_categories(id, name, color)')
      .eq('tenant_id', request.tenantId)
      .not('publish_date', 'is', null)
      .gte('publish_date', request.query.start)
      .lte('publish_date', request.query.end)
      .order('publish_date');

    if (error) throw error;
    return { success: true, data };
  });

  // Categories CRUD
  fastify.get('/categories', async (request) => {
    const { data, error } = await fastify.supabase
      .from('content_categories')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('name');

    if (error) throw error;
    return { success: true, data };
  });

  fastify.post<{ Body: Record<string, unknown> }>('/categories', async (request) => {
    const { data, error } = await fastify.supabase
      .from('content_categories')
      .insert({ ...request.body, tenant_id: request.tenantId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });
}
