import type { FastifyInstance } from 'fastify';

export async function leaveRoutes(fastify: FastifyInstance) {
  // List leave requests
  fastify.get('/', async (request) => {
    const { status, employee_id } = request.query as { status?: string; employee_id?: string };
    let query = fastify.supabase
      .from('leave_requests')
      .select('*, employee:employees(id, first_name, last_name, avatar_url, department:departments(id, name))')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);
    if (employee_id) query = query.eq('employee_id', employee_id);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Submit leave request
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('leave_requests')
      .insert({ ...request.body, tenant_id: request.tenantId })
      .select('*, employee:employees(id, first_name, last_name)')
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Approve or reject leave request
  fastify.patch<{ Params: { id: string }; Body: { status: string; notes?: string } }>(
    '/:id/approve',
    async (request, reply) => {
      const newStatus = request.body.status;
      if (!['approved', 'rejected'].includes(newStatus)) {
        reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be approved or rejected' } });
        return;
      }

      const { data, error } = await fastify.supabase
        .from('leave_requests')
        .update({
          status: newStatus,
          approved_by: request.userId,
          approved_at: new Date().toISOString(),
          notes: request.body.notes || null,
        })
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select('*, employee:employees(id, first_name, last_name)')
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Leave request not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
