import type { FastifyInstance } from 'fastify';

export async function accountsRoutes(fastify: FastifyInstance) {
  // List connected social accounts
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_accounts')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('platform', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });

  // Connect new account
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('social_accounts')
      .insert({ ...request.body, tenant_id: request.tenantId, connected_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update account
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('social_accounts')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Account not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Disconnect account
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('social_accounts')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });
}
