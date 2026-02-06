import type { FastifyInstance } from 'fastify';

export async function recommendationsRoutes(fastify: FastifyInstance) {
  // Update recommendation status
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('seo_recommendations')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Recommendation not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
