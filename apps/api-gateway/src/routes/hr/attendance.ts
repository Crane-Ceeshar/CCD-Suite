import type { FastifyInstance } from 'fastify';

export async function attendanceRoutes(fastify: FastifyInstance) {
  // List attendance records
  fastify.get('/', async (request) => {
    const { employee_id, date_from, date_to } = request.query as {
      employee_id?: string;
      date_from?: string;
      date_to?: string;
    };

    let query = fastify.supabase
      .from('attendance_records')
      .select('*, employee:employees(id, first_name, last_name, avatar_url)')
      .eq('tenant_id', request.tenantId)
      .order('date', { ascending: false });

    if (employee_id) query = query.eq('employee_id', employee_id);
    if (date_from) query = query.gte('date', date_from);
    if (date_to) query = query.lte('date', date_to);

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Record attendance
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const body = request.body as any;

    // Calculate hours worked if both clock_in and clock_out provided
    let hoursWorked = null;
    if (body.clock_in && body.clock_out) {
      const diffMs = new Date(body.clock_out).getTime() - new Date(body.clock_in).getTime();
      hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    const { data, error } = await fastify.supabase
      .from('attendance_records')
      .insert({
        ...body,
        hours_worked: hoursWorked,
        tenant_id: request.tenantId,
      })
      .select('*, employee:employees(id, first_name, last_name)')
      .single();

    if (error) throw error;
    return { success: true, data };
  });
}
