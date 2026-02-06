import type { FastifyInstance } from 'fastify';

export async function postsRoutes(fastify: FastifyInstance) {
  // List posts
  fastify.get('/', async (request) => {
    const { status, platform } = request.query as { status?: string; platform?: string };
    let query = fastify.supabase
      .from('social_posts')
      .select('*, campaign:social_campaigns(id, name)')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (platform) query = query.contains('platforms', [platform]);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Get post by ID with engagement
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('social_posts')
      .select('*, campaign:social_campaigns(id, name), engagement:social_engagement(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create post
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_posts')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update post
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('social_posts')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete post
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('social_posts')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });

  // Publish post immediately
  fastify.post<{ Params: { id: string } }>('/:id/publish', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('social_posts')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
      return;
    }
    return { success: true, data };
  });
}
