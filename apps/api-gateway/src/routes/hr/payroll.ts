import type { FastifyInstance } from 'fastify';

export async function payrollRoutes(fastify: FastifyInstance) {
  // List payroll runs
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('payroll_runs')
      .select('*')
      .eq('tenant_id', request.tenantId)
      .order('period_start', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Create payroll run (auto-generates items from active employees)
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const body = request.body as any;

    // Create the payroll run
    const { data: run, error: runError } = await fastify.supabase
      .from('payroll_runs')
      .insert({
        period_start: body.period_start,
        period_end: body.period_end,
        currency: body.currency || 'USD',
        notes: body.notes || null,
        tenant_id: request.tenantId,
      })
      .select()
      .single();

    if (runError) throw runError;

    // Get active employees with salary
    const { data: employees } = await fastify.supabase
      .from('employees')
      .select('id, salary')
      .eq('tenant_id', request.tenantId)
      .eq('status', 'active')
      .not('salary', 'is', null);

    if (employees && employees.length > 0) {
      // Create payroll items for each employee
      const items = employees.map((emp: any) => {
        const gross = Number(emp.salary) || 0;
        const deductions = Math.round(gross * 0.25 * 100) / 100; // 25% estimated deductions
        const net = gross - deductions;
        return {
          payroll_run_id: run.id,
          employee_id: emp.id,
          gross_amount: gross,
          deductions,
          net_amount: net,
          breakdown: { base_salary: gross, tax_estimate: deductions },
        };
      });

      const { error: itemsError } = await fastify.supabase
        .from('payroll_items')
        .insert(items);

      if (itemsError) throw itemsError;

      // Update run totals
      const totalGross = items.reduce((sum: number, i: any) => sum + i.gross_amount, 0);
      const totalDeductions = items.reduce((sum: number, i: any) => sum + i.deductions, 0);
      const totalNet = items.reduce((sum: number, i: any) => sum + i.net_amount, 0);

      await fastify.supabase
        .from('payroll_runs')
        .update({ total_gross: totalGross, total_deductions: totalDeductions, total_net: totalNet })
        .eq('id', run.id);
    }

    // Re-fetch with items
    const { data, error } = await fastify.supabase
      .from('payroll_runs')
      .select('*, items:payroll_items(*, employee:employees(id, first_name, last_name))')
      .eq('id', run.id)
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update payroll run status
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const body = request.body as any;
      const updateData: any = { ...body };

      if (body.status === 'completed') {
        updateData.processed_by = request.userId;
        updateData.processed_at = new Date().toISOString();
      }

      const { data, error } = await fastify.supabase
        .from('payroll_runs')
        .update(updateData)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select()
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Payroll run not found' } });
        return;
      }
      return { success: true, data };
    }
  );
}
