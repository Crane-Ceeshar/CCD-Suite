import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { taxQuerySchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/finance/tax
 * Tax summary: total tax collected, quarterly breakdown, by tax rate.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'finance:tax' });
  if (limited) return limitResp!;

  const { data: query, error: queryError } = validateQuery(
    request.nextUrl.searchParams,
    taxQuerySchema
  );
  if (queryError) return queryError;

  const { year, quarter } = query!;
  const yearNum = parseInt(year, 10) || new Date().getFullYear();

  // Date range for the year
  const yearStart = `${yearNum}-01-01`;
  const yearEnd = `${yearNum}-12-31`;

  try {
    // Build query — only paid/sent invoices that have tax
    let dbQuery = supabase
      .from('invoices')
      .select('total, subtotal, tax_amount, tax_rate, issue_date, status')
      .in('status', ['paid', 'sent', 'overdue'])
      .gte('issue_date', yearStart)
      .lte('issue_date', yearEnd);

    // Optional quarter filter
    if (quarter) {
      const q = parseInt(quarter, 10);
      if (q >= 1 && q <= 4) {
        const qStart = `${yearNum}-${String((q - 1) * 3 + 1).padStart(2, '0')}-01`;
        const qEndMonth = q * 3;
        const qEndDay = new Date(yearNum, qEndMonth, 0).getDate();
        const qEnd = `${yearNum}-${String(qEndMonth).padStart(2, '0')}-${String(qEndDay).padStart(2, '0')}`;
        dbQuery = dbQuery.gte('issue_date', qStart).lte('issue_date', qEnd);
      }
    }

    const { data: invoices, error: fetchError } = await dbQuery;

    if (fetchError) {
      return dbError(fetchError, 'Failed to fetch tax data');
    }

    const allInvoices = invoices ?? [];

    // Total tax collected
    const total_tax_collected = allInvoices.reduce((sum, inv) => sum + (inv.tax_amount ?? 0), 0);
    const total_revenue = allInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
    const total_subtotal = allInvoices.reduce((sum, inv) => sum + (inv.subtotal ?? 0), 0);

    // Quarterly breakdown
    const quarters: Record<string, { tax: number; revenue: number; invoice_count: number }> = {
      Q1: { tax: 0, revenue: 0, invoice_count: 0 },
      Q2: { tax: 0, revenue: 0, invoice_count: 0 },
      Q3: { tax: 0, revenue: 0, invoice_count: 0 },
      Q4: { tax: 0, revenue: 0, invoice_count: 0 },
    };

    for (const inv of allInvoices) {
      if (!inv.issue_date) continue;
      const month = parseInt(inv.issue_date.substring(5, 7), 10);
      const qKey = month <= 3 ? 'Q1' : month <= 6 ? 'Q2' : month <= 9 ? 'Q3' : 'Q4';
      quarters[qKey].tax += inv.tax_amount ?? 0;
      quarters[qKey].revenue += inv.total ?? 0;
      quarters[qKey].invoice_count += 1;
    }

    const quarterly_breakdown = Object.entries(quarters).map(([q, data]) => ({
      quarter: q,
      tax_collected: Math.round(data.tax * 100) / 100,
      revenue: Math.round(data.revenue * 100) / 100,
      invoice_count: data.invoice_count,
    }));

    // Breakdown by tax rate
    const rateMap = new Map<number, { count: number; tax: number; subtotal: number }>();
    for (const inv of allInvoices) {
      const rate = inv.tax_rate ?? 0;
      const entry = rateMap.get(rate) ?? { count: 0, tax: 0, subtotal: 0 };
      entry.count += 1;
      entry.tax += inv.tax_amount ?? 0;
      entry.subtotal += inv.subtotal ?? 0;
      rateMap.set(rate, entry);
    }
    const by_rate = Array.from(rateMap.entries())
      .map(([rate, data]) => ({
        tax_rate: rate,
        invoice_count: data.count,
        tax_collected: Math.round(data.tax * 100) / 100,
        taxable_amount: Math.round(data.subtotal * 100) / 100,
      }))
      .sort((a, b) => a.tax_rate - b.tax_rate);

    return NextResponse.json({
      success: true,
      data: {
        year: yearNum,
        total_tax_collected: Math.round(total_tax_collected * 100) / 100,
        total_revenue: Math.round(total_revenue * 100) / 100,
        total_subtotal: Math.round(total_subtotal * 100) / 100,
        effective_tax_rate: total_subtotal > 0
          ? Math.round((total_tax_collected / total_subtotal) * 10000) / 100
          : 0,
        quarterly_breakdown,
        by_rate,
        invoice_count: allInvoices.length,
      },
    });
  } catch (err) {
    console.error('Tax summary error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to compute tax summary' } },
      { status: 500 }
    );
  }
}
