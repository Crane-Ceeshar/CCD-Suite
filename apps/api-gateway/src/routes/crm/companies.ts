import type { FastifyInstance } from 'fastify';

export async function companiesRoutes(fastify: FastifyInstance) {
  // List companies
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('companies')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get company by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('companies')
      .select('*')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create company
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('companies')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update company
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('companies')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Company not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete company
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('companies')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });
}
