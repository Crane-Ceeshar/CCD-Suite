import type { FastifyInstance } from 'fastify';

export async function keywordsRoutes(fastify: FastifyInstance) {
  // Update keyword
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('seo_keywords')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Keyword not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete keyword
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('seo_keywords')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });

  // Get rank history for keyword
  fastify.get<{ Params: { id: string } }>('/:id/history', async (request) => {
    const { data, error } = await fastify.supabase
      .from('seo_rank_history')
      .select('*')
      .eq('keyword_id', request.params.id)
      .order('date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });
}
