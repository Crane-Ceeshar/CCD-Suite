import type { FastifyInstance } from 'fastify';

export async function paymentsRoutes(fastify: FastifyInstance) {
  // List payments
  fastify.get('/', async (request) => {
    const { data, error } = await fastify.supabase
      .from('payments')
      .select('*, invoice:invoices(id, invoice_number, total, status)')
      .eq('tenant_id', request.tenantId)
      .order('payment_date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  });

  // Record payment
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const body = request.body as any;

    // Create payment
    const { data: payment, error: paymentError } = await fastify.supabase
      .from('payments')
      .insert({ ...body, tenant_id: request.tenantId, created_by: request.userId })
      .select('*, invoice:invoices(id, invoice_number, total, status)')
      .single();

    if (paymentError) throw paymentError;

    // If linked to an invoice, check if invoice should be marked as paid
    if (body.invoice_id) {
      // Get total payments for this invoice
      const { data: allPayments } = await fastify.supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', body.invoice_id)
        .eq('tenant_id', request.tenantId);

      const totalPaid = (allPayments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

      // Get invoice total
      const { data: invoice } = await fastify.supabase
        .from('invoices')
        .select('total')
        .eq('id', body.invoice_id)
        .single();

      if (invoice && totalPaid >= Number(invoice.total)) {
        await fastify.supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', body.invoice_id);
      }
    }

    return { success: true, data: payment };
  });
}
