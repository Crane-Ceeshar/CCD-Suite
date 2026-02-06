import type { FastifyInstance } from 'fastify';

export async function invoicesRoutes(fastify: FastifyInstance) {
  // List invoices
  fastify.get('/', async (request) => {
    const { status } = request.query as { status?: string };
    let query = fastify.supabase
      .from('invoices')
      .select('*, company:companies(id, name), contact:contacts(id, first_name, last_name)')
      .eq('tenant_id', request.tenantId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, data };
  });

  // Get invoice by ID (with items, company, contact, payments)
  fastify.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('invoices')
      .select('*, items:invoice_items(*), company:companies(*), contact:contacts(*), payments(*)')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (error || !data) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return;
    }

    // Sort items by sort_order
    if (data.items) {
      data.items.sort((a: any, b: any) => a.sort_order - b.sort_order);
    }

    return { success: true, data };
  });

  // Create invoice with line items
  fastify.post<{ Body: Record<string, unknown> }>('/', async (request) => {
    const { items, ...invoiceData } = request.body as any;

    // Calculate totals from items
    const lineItems = (items || []).map((item: any, index: number) => ({
      ...item,
      amount: (item.quantity || 1) * (item.unit_price || 0),
      sort_order: index,
    }));

    const subtotal = lineItems.reduce((sum: number, item: any) => sum + item.amount, 0);
    const taxRate = invoiceData.tax_rate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await fastify.supabase
      .from('invoices')
      .insert({
        ...invoiceData,
        subtotal,
        tax_amount: taxAmount,
        total,
        tenant_id: request.tenantId,
        created_by: request.userId,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    // Create line items
    if (lineItems.length > 0) {
      const { error: itemsError } = await fastify.supabase
        .from('invoice_items')
        .insert(lineItems.map((item: any) => ({
          ...item,
          invoice_id: invoice.id,
        })));

      if (itemsError) throw itemsError;
    }

    // Re-fetch with joins
    const { data, error } = await fastify.supabase
      .from('invoices')
      .select('*, items:invoice_items(*), company:companies(id, name), contact:contacts(id, first_name, last_name)')
      .eq('id', invoice.id)
      .single();

    if (error) throw error;
    return { success: true, data };
  });

  // Update invoice
  fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
    '/:id',
    async (request, reply) => {
      const { data, error } = await fastify.supabase
        .from('invoices')
        .update(request.body)
        .eq('id', request.params.id)
        .eq('tenant_id', request.tenantId)
        .select('*, company:companies(id, name), contact:contacts(id, first_name, last_name)')
        .single();

      if (error) throw error;
      if (!data) {
        reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
        return;
      }
      return { success: true, data };
    }
  );

  // Delete draft invoice
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    // Only allow deleting drafts
    const { data: existing } = await fastify.supabase
      .from('invoices')
      .select('status')
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .single();

    if (!existing) {
      reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
      return;
    }

    if (existing.status !== 'draft') {
      reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Only draft invoices can be deleted' } });
      return;
    }

    const { error } = await fastify.supabase
      .from('invoices')
      .delete()
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId);

    if (error) throw error;
    return { success: true };
  });

  // Send invoice (mark as sent)
  fastify.post<{ Params: { id: string } }>('/:id/send', async (request, reply) => {
    const { data, error } = await fastify.supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', request.params.id)
      .eq('tenant_id', request.tenantId)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      reply.status(400).send({ success: false, error: { code: 'INVALID_STATUS', message: 'Invoice must be in draft status to send' } });
      return;
    }
    return { success: true, data };
  });
}
