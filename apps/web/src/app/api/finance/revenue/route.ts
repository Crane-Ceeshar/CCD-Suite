import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { validateQuery } from '@/lib/api/validate';
import { revenueQuerySchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/finance/revenue
 * Revenue analytics: monthly trends, top clients, aging buckets, income vs expenses.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'finance:revenue' });
  if (limited) return limitResp!;

  const { data: query, error: queryError } = validateQuery(
    request.nextUrl.searchParams,
    revenueQuerySchema
  );
  if (queryError) return queryError;

  const { period } = query!;

  // Calculate date range based on period
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '30d':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
      break;
    case '90d':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
      break;
    case '6m':
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      break;
    case '1y':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      startDate = new Date(2000, 0, 1);
      break;
  }

  const startStr = startDate.toISOString();

  try {
    const [
      paidInvoicesRes,
      outstandingInvoicesRes,
      expensesRes,
      recentPaymentsRes,
      overdueInvoicesRes,
    ] = await Promise.all([
      // All paid invoices in the period
      supabase
        .from('invoices')
        .select('total, tax_amount, updated_at, company_id, company:companies(id, name)')
        .eq('status', 'paid')
        .gte('updated_at', startStr),

      // Outstanding invoices (sent or overdue)
      supabase
        .from('invoices')
        .select('total, due_date, issue_date, status')
        .in('status', ['sent', 'overdue']),

      // Approved expenses in the period
      supabase
        .from('expenses')
        .select('amount, expense_date, category')
        .eq('status', 'approved')
        .gte('expense_date', startStr),

      // Payments in the period for monthly trend
      supabase
        .from('payments')
        .select('amount, payment_date')
        .gte('payment_date', startStr)
        .order('payment_date', { ascending: true }),

      // Overdue invoices for aging
      supabase
        .from('invoices')
        .select('total, due_date')
        .eq('status', 'overdue'),
    ]);

    if (paidInvoicesRes.error) return dbError(paidInvoicesRes.error, 'Failed to fetch revenue data');
    if (outstandingInvoicesRes.error) return dbError(outstandingInvoicesRes.error, 'Failed to fetch revenue data');
    if (expensesRes.error) return dbError(expensesRes.error, 'Failed to fetch revenue data');
    if (recentPaymentsRes.error) return dbError(recentPaymentsRes.error, 'Failed to fetch revenue data');

    const paidInvoices = paidInvoicesRes.data ?? [];
    const outstandingInvoices = outstandingInvoicesRes.data ?? [];
    const expenses = expensesRes.data ?? [];
    const payments = recentPaymentsRes.data ?? [];
    const overdueInvoices = overdueInvoicesRes.data ?? [];

    // Summary stats
    const total_revenue = paidInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
    const total_outstanding = outstandingInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);
    const total_expenses = expenses.reduce((sum, exp) => sum + (exp.amount ?? 0), 0);
    const net_profit = total_revenue - total_expenses;

    // Monthly revenue trend (group payments by month)
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
    for (const p of payments) {
      const month = p.payment_date?.substring(0, 7) ?? 'unknown'; // YYYY-MM
      const entry = monthlyMap.get(month) ?? { revenue: 0, expenses: 0 };
      entry.revenue += p.amount ?? 0;
      monthlyMap.set(month, entry);
    }
    for (const exp of expenses) {
      const month = exp.expense_date?.substring(0, 7) ?? 'unknown';
      const entry = monthlyMap.get(month) ?? { revenue: 0, expenses: 0 };
      entry.expenses += exp.amount ?? 0;
      monthlyMap.set(month, entry);
    }
    const monthly_trends = Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue * 100) / 100,
        expenses: Math.round(data.expenses * 100) / 100,
        profit: Math.round((data.revenue - data.expenses) * 100) / 100,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top clients by revenue
    const clientMap = new Map<string, { id: string; name: string; revenue: number }>();
    for (const inv of paidInvoices) {
      const company = inv.company as unknown as { id: string; name: string } | null;
      if (company) {
        const entry = clientMap.get(company.id) ?? { id: company.id, name: company.name, revenue: 0 };
        entry.revenue += inv.total ?? 0;
        clientMap.set(company.id, entry);
      }
    }
    const top_clients = Array.from(clientMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((c) => ({ ...c, revenue: Math.round(c.revenue * 100) / 100 }));

    // Invoice aging buckets
    const nowMs = now.getTime();
    const aging_buckets = { current: 0, '1_30': 0, '31_60': 0, '61_90': 0, '90_plus': 0 };
    for (const inv of overdueInvoices) {
      if (!inv.due_date) continue;
      const dueMs = new Date(inv.due_date).getTime();
      const daysOverdue = Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24));
      const amount = inv.total ?? 0;
      if (daysOverdue <= 0) aging_buckets.current += amount;
      else if (daysOverdue <= 30) aging_buckets['1_30'] += amount;
      else if (daysOverdue <= 60) aging_buckets['31_60'] += amount;
      else if (daysOverdue <= 90) aging_buckets['61_90'] += amount;
      else aging_buckets['90_plus'] += amount;
    }

    // Expenses by category
    const categoryMap = new Map<string, number>();
    for (const exp of expenses) {
      const cat = exp.category ?? 'other';
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (exp.amount ?? 0));
    }
    const expenses_by_category = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({ category, amount: Math.round(amount * 100) / 100 }))
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      success: true,
      data: {
        total_revenue: Math.round(total_revenue * 100) / 100,
        total_outstanding: Math.round(total_outstanding * 100) / 100,
        total_expenses: Math.round(total_expenses * 100) / 100,
        net_profit: Math.round(net_profit * 100) / 100,
        monthly_trends,
        top_clients,
        aging_buckets,
        expenses_by_category,
      },
    });
  } catch (err) {
    console.error('Revenue analytics error:', err);
    return NextResponse.json(
      { success: false, error: { message: 'Failed to compute revenue analytics' } },
      { status: 500 }
    );
  }
}
