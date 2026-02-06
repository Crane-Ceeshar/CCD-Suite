import type { FastifyInstance } from 'fastify';

export async function campaignsRoutes(fastify: FastifyInstance) {
  // List campaigns
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_campaigns')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Create campaign
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_campaigns')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update campaign
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('social_campaigns')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Get posts in campaign
  fastify.get<{ Params: { id: string } }>('/:id/posts', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_posts')
      .select('*')
      .eq('campaign_id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });
}
