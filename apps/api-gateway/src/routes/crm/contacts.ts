import type { FastifyInstance } from 'fastify';

export async function contactsRoutes(fastify: FastifyInstance) {
  // List contacts
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('contacts')
      .select('*, company:companies(id, name)')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Get contact by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('contacts')
      .select('*, company:companies(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create contact
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('contacts')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update contact
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('contacts')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete contact
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('contacts')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });
}
