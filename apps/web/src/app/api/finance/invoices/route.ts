import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createInvoiceSchema, invoiceListQuerySchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/finance/invoices
 * List invoices with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:invoices:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    invoiceListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, company_id, contact_id, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('invoices')
    .select('*, company:companies(id,name), contact:contacts(id,first_name,last_name)', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (search) {
    dbQuery = dbQuery.ilike('invoice_number', `%${search}%`);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (company_id) {
    dbQuery = dbQuery.eq('company_id', company_id);
  }
  if (contact_id) {
    dbQuery = dbQuery.eq('contact_id', contact_id);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch invoices');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/finance/invoices
 * Create a new invoice with line items.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'finance:invoices:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createInvoiceSchema);
  if (bodyError) return bodyError;

  const { items, ...invoiceFields } = body;

  // Calculate totals from line items
  const subtotal = items.reduce((sum: number, item: { quantity: number; unit_price: number }) => {
    return sum + item.quantity * item.unit_price;
  }, 0);
  const taxRate = invoiceFields.tax_rate ?? 0;
  const tax_amount = subtotal * taxRate / 100;
  const total = subtotal + tax_amount;

  // Insert the invoice
  const { data: invoice, error: insertError } = await supabase
    .from('invoices')
    .insert({
      tenant_id: profile.tenant_id,
      invoice_number: invoiceFields.invoice_number,
      contact_id: invoiceFields.contact_id ?? null,
      company_id: invoiceFields.company_id ?? null,
      issue_date: invoiceFields.issue_date ?? new Date().toISOString().split('T')[0],
      due_date: invoiceFields.due_date ?? null,
      tax_rate: taxRate,
      currency: invoiceFields.currency,
      notes: invoiceFields.notes ?? null,
      subtotal,
      tax_amount,
      total,
      status: 'draft',
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create invoice');
  }

  // Insert line items
  const lineItems = items.map((item: { description: string; quantity: number; unit_price: number }, index: number) => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    amount: item.quantity * item.unit_price,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(lineItems);

  if (itemsError) {
    return dbError(itemsError, 'Failed to create invoice items');
  }

  // Re-fetch invoice with items joined
  const { data: fullInvoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*, company:companies(id,name), contact:contacts(id,first_name,last_name)')
    .eq('id', invoice.id)
    .single();

  const { data: createdItems } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoice.id);

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch created invoice');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'invoice.created',
    resource_type: 'invoice',
    resource_id: invoice.id,
    details: { invoice_number: invoice.invoice_number, total },
  });

  return success({ ...fullInvoice, items: createdItems ?? [] }, 201);
}
