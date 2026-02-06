import type { FastifyInstance } from 'fastify';

export async function expensesRoutes(fastify: FastifyInstance) {
  // List expenses
  fastify.get('/', async (request) => {
    const { status, category } = request.query as { status?: string; category?: string };
    let query = fastify.supabase
      .from('expenses')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('expense_date', { ascending: false });

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Get expense by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('expenses')
      .select('*')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create expense
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('expenses')
      .insert({ ...request.body, tenant_id: request.tenantId, created_by: request.userId })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update expense
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('expenses')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Approve or reject expense
  fastify.patch<{ Params: { id: string }; Body: { status: string } }>(
    '/:id/approve',
    async (request, reply) => {
      const newStatus = request.body.status;
      if (!['approved', 'rejected'].includes(newStatus)) {
        reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be approved or rejected' } });
        return;
      }

      const { data, error } = await fastify.supabase
        .from('expenses')
        .update({ status: newStatus, approved_by: request.userId })
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete pending expense
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data: existing } = await fastify.supabase
      .from('expenses')
      .select('status')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (!existing) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
      return;
    }

    if (existing.status !== 'pending') {
      reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Only pending expenses can be deleted' } });
      return;
    }

    const { error } = await fastify.supabase
      .from('expenses')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });
}
