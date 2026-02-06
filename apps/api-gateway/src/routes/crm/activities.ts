import type { FastifyInstance } from 'fastify';

export async function activitiesRoutes(fastify: FastifyInstance) {
  // List activities (optionally filtered by deal/contact/company)
  fastify.get<{ Querystring: { deal_id?: string; contact_id?: string; company_id?: string } }>(
    '/',
    async (request) => {
      let query = fastify.supabase
        .from('activities')
        .select('*')
        .eq('tenant_id', request.tenantId)
        .order('created_at', { ascending: false });

      if (request.query.deal_id) query = query.eq('deal_id', request.query.deal_id);
      if (request.query.contact_id) query = query.eq('contact_id', request.query.contact_id);
      if (request.query.company_id) query = query.eq('company_id', request.query.company_id);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data };
    }
  );

  // Create activity
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('activities')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Mark activity as completed
  fastify.patch<{ Params: { id: string } }>(
    '/:id/complete',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('activities')
        .update({ is_completed: true, completed_at: new Date().toISOString() })
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Activity not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete activity
  fastify.delete<{ Params: { id: string } }>('/:id', async (request) => {
    const { error } = await fastify.supabase
      .from('activities')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });
}
