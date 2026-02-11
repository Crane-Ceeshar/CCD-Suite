import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateInvoiceSchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/finance/invoices/:id
 * Fetch a single invoice with items, company, contact, and payments.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:invoices:get' });
  if (limited) return limitResp!;

  const [invoiceRes, itemsRes, paymentsRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, company:companies(id,name), contact:contacts(id,first_name,last_name,email)')
      .eq('id', id)
      .single(),
    supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id),
    supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', id),
  ]);

  if (invoiceRes.error) {
    return dbError(invoiceRes.error, 'Invoice');
  }

  return success({
    ...invoiceRes.data,
    items: itemsRes.data ?? [],
    payments: paymentsRes.data ?? [],
  });
}

/**
 * PATCH /api/finance/invoices/:id
 * Update an invoice.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:invoices:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateInvoiceSchema);
  if (bodyError) return bodyError;

  // Build update fields — only include provided fields
  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'invoice_number', 'contact_id', 'company_id', 'status',
    'issue_date', 'due_date', 'tax_rate', 'currency', 'notes',
  ] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('invoices')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Invoice');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'invoice.updated',
    resource_type: 'invoice',
    resource_id: id,
    details: { invoice_number: data.invoice_number, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/finance/invoices/:id
 * Delete an invoice (only if status is draft).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'finance:invoices:delete' });
  if (limited) return limitResp!;

  // Verify invoice exists and check status
  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('id, invoice_number, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Invoice');
  }

  if (invoice.status !== 'draft') {
    return errorResponse('Only draft invoices can be deleted', 400);
  }

  // Delete related data first
  await supabase.from('invoice_items').delete().eq('invoice_id', id);
  await supabase.from('payments').delete().eq('invoice_id', id);

  const { error: deleteError } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete invoice');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'invoice.deleted',
    resource_type: 'invoice',
    resource_id: id,
    details: { invoice_number: invoice.invoice_number },
  });

  return success({ deleted: true });
}
