import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createPaymentSchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/finance/invoices/:id/payments
 * List payments for a specific invoice.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:payments:list' });
  if (limited) return limitResp!;

  const { data, error: queryError, count } = await supabase
    .from('payments')
    .select('*', { count: 'exact' })
    .eq('invoice_id', id)
    .order('payment_date', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch payments');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/finance/invoices/:id/payments
 * Record a payment against this invoice.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'finance:payments:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createPaymentSchema);
  if (bodyError) return bodyError;

  // Insert the payment linked to this invoice
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      tenant_id: profile.tenant_id,
      invoice_id: id,
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

  // Sum all payments for this invoice to check if fully paid
  const { data: paymentsSum, error: sumError } = await supabase
    .from('payments')
    .select('amount')
    .eq('invoice_id', id);

  if (!sumError && paymentsSum) {
    const totalPaid = paymentsSum.reduce((sum: number, p: { amount: number }) => sum + p.amount, 0);

    // Fetch the invoice total to compare
    const { data: invoice } = await supabase
      .from('invoices')
      .select('total')
      .eq('id', id)
      .single();

    if (invoice && totalPaid >= invoice.total) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', id);
    }
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'payment.recorded',
    resource_type: 'payment',
    resource_id: payment.id,
    details: { invoice_id: id, amount: body.amount },
  });

  return success(payment, 201);
}
