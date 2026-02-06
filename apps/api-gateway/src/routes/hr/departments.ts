import type { FastifyInstance } from 'fastify';

export async function departmentsRoutes(fastify: FastifyInstance) {
  // List departments
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('departments')
      .select('*, head:employees!head_id(id, first_name, last_name, avatar_url)')
      .eq('tenant_id', request.tenantId)
      .order('name', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  });

  // Create department
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('departments')
      .insert({ ...request.body, tenant_id: request.tenantId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update department
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('departments')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Department not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
