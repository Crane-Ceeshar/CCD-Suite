import type { FastifyInstance } from 'fastify';

export async function auditsRoutes(fastify: FastifyInstance) {
  // Get audit results
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('seo_audits')
      .select('*')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Audit not found' } });
      return;
    }
    return { success: true, data };
  });
}
