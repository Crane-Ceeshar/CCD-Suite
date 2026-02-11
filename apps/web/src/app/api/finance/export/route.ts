import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { exportSchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * POST /api/finance/export
 * Export invoices, expenses, or payments as CSV.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 10, keyPrefix: 'finance:export' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, exportSchema);
  if (bodyError) return bodyError;

  const { type, status, from, to } = body;

  try {
    let csvContent = '';
    let filename = '';

    if (type === 'invoices') {
      let dbQuery = supabase
        .from('invoices')
        .select('invoice_number, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, currency, company:companies(name), contact:contacts(first_name, last_name), created_at')
        .order('issue_date', { ascending: false });

      if (status) dbQuery = dbQuery.eq('status', status);
      if (from) dbQuery = dbQuery.gte('issue_date', from);
      if (to) dbQuery = dbQuery.lte('issue_date', to);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export invoices');

      const rows = data ?? [];
      csvContent = 'Invoice Number,Status,Issue Date,Due Date,Subtotal,Tax Rate,Tax Amount,Total,Currency,Company,Contact,Created At\n';
      for (const row of rows) {
        const company = row.company as unknown as { name: string } | null;
        const contact = row.contact as unknown as { first_name: string; last_name: string } | null;
        csvContent += [
          escapeCsv(row.invoice_number),
          escapeCsv(row.status),
          escapeCsv(row.issue_date),
          escapeCsv(row.due_date),
          row.subtotal ?? 0,
          row.tax_rate ?? 0,
          row.tax_amount ?? 0,
          row.total ?? 0,
          escapeCsv(row.currency),
          escapeCsv(company?.name ?? ''),
          escapeCsv(contact ? `${contact.first_name} ${contact.last_name}` : ''),
          escapeCsv(row.created_at),
        ].join(',') + '\n';
      }
      filename = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'expenses') {
      let dbQuery = supabase
        .from('expenses')
        .select('description, category, vendor, amount, currency, expense_date, status, notes, created_at')
        .order('expense_date', { ascending: false });

      if (status) dbQuery = dbQuery.eq('status', status);
      if (from) dbQuery = dbQuery.gte('expense_date', from);
      if (to) dbQuery = dbQuery.lte('expense_date', to);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export expenses');

      const rows = data ?? [];
      csvContent = 'Description,Category,Vendor,Amount,Currency,Expense Date,Status,Notes,Created At\n';
      for (const row of rows) {
        csvContent += [
          escapeCsv(row.description),
          escapeCsv(row.category),
          escapeCsv(row.vendor),
          row.amount ?? 0,
          escapeCsv(row.currency),
          escapeCsv(row.expense_date),
          escapeCsv(row.status),
          escapeCsv(row.notes),
          escapeCsv(row.created_at),
        ].join(',') + '\n';
      }
      filename = `expenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'payments') {
      let dbQuery = supabase
        .from('payments')
        .select('amount, currency, payment_method, payment_date, reference, notes, invoice:invoices(invoice_number), created_at')
        .order('payment_date', { ascending: false });

      if (from) dbQuery = dbQuery.gte('payment_date', from);
      if (to) dbQuery = dbQuery.lte('payment_date', to);

      const { data, error: fetchError } = await dbQuery;
      if (fetchError) return dbError(fetchError, 'Failed to export payments');

      const rows = data ?? [];
      csvContent = 'Amount,Currency,Payment Method,Payment Date,Reference,Notes,Invoice Number,Created At\n';
      for (const row of rows) {
        const invoice = row.invoice as unknown as { invoice_number: string } | null;
        csvContent += [
          row.amount ?? 0,
          escapeCsv(row.currency),
          escapeCsv(row.payment_method),
          escapeCsv(row.payment_date),
          escapeCsv(row.reference),
          escapeCsv(row.notes),
          escapeCsv(invoice?.invoice_number ?? ''),
          escapeCsv(row.created_at),
        ].join(',') + '\n';
      }
      filename = `payments_export_${new Date().toISOString().split('T')[0]}.csv`;
    }

    logAudit(supabase, profile.tenant_id, user.id, {
      action: 'finance.exported',
      resource_type: type,
      details: { type, status: status ?? 'all', from: from ?? 'all', to: to ?? 'all' },
    });

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Export error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to generate export' } },
      { status: 500 }
    );
  }
}

/** Escape a value for CSV output */
function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
