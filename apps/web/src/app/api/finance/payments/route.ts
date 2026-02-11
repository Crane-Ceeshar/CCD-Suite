import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createPaymentSchema, paymentListQuerySchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/finance/payments
 * List payments with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:payments:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    paymentListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { invoice_id, payment_method, from, to, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('payments')
    .select('*, invoice:invoices(id, invoice_number, total, status, company:companies(id, name))', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (invoice_id) {
    dbQuery = dbQuery.eq('invoice_id', invoice_id);
  }
  if (payment_method) {
    dbQuery = dbQuery.eq('payment_method', payment_method);
  }
  if (from) {
    dbQuery = dbQuery.gte('payment_date', from);
  }
  if (to) {
    dbQuery = dbQuery.lte('payment_date', to);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch payments');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/finance/payments
 * Record a standalone payment. Auto-marks invoice as paid if fully covered.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'finance:payments:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createPaymentSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('payments')
    .insert({
      tenant_id: profile.tenant_id,
      invoice_id: body.invoice_id ?? null,
      amount: body.amount,
      currency: body.currency,
      payment_method: body.payment_method,
      payment_date: body.payment_date ?? new Date().toISOString().split('T')[0],
      reference: body.reference ?? null,
      notes: body.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to record payment');
  }

  // If payment is linked to an invoice, check if the invoice is now fully paid
  if (body.invoice_id) {
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', body.invoice_id);

    const totalPaid = (payments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0);

    const { data: invoice } = await supabase
      .from('invoices')
      .select('total')
      .eq('id', body.invoice_id)
      .single();

    if (invoice && totalPaid >= invoice.total) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', body.invoice_id);
    }
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'payment.recorded',
    resource_type: 'payment',
    resource_id: data.id,
    details: { amount: data.amount, invoice_id: body.invoice_id ?? null },
  });

  return success(data, 201);
}
