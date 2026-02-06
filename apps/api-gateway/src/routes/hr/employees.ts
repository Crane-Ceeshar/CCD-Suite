import type { FastifyInstance } from 'fastify';

export async function employeesRoutes(fastify: FastifyInstance) {
  // List employees
  fastify.get('/', async (request) => {
    const { status, department_id } = request.query as { status?: string; department_id?: string };
    let query = fastify.supabase
      .from('employees')
      .select('*, department:departments(id, name), manager:employees!manager_id(id, first_name, last_name)')
      .eq('tenant_id', request.tenantId)
      .order('last_name', { ascending: true });

    if (status) query = query.eq('status', status);
    if (department_id) query = query.eq('department_id', department_id);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Get employee by ID
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('employees')
      .select('*, department:departments(*), manager:employees!manager_id(id, first_name, last_name)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
      return;
    }
    return { success: true, data };
  });

  // Create employee
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('employees')
      .insert({ ...request.body, tenant_id: request.tenantId })
      .select('*, department:departments(id, name)')
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update employee
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('employees')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select('*, department:departments(id, name)')
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Soft-delete employee (set status to terminated)
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('employees')
      .update({ status: 'terminated', termination_date: new Date().toISOString().split('T')[0] })
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Employee not found' } });
      return;
    }
    return { success: true, data };
  });
}
