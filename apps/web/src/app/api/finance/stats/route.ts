import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/finance/stats
 * Dashboard statistics for the finance module.
 */
export async function GET(_request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 60, keyPrefix: 'finance:stats' });
  if (limited) return limitResp!;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const [
    paidThisMonthRes,
    outstandingRes,
    expensesThisMonthRes,
    invoiceCountRes,
    expenseCountRes,
    overdueCountRes,
  ] = await Promise.all([
    // total_revenue: SUM of total from invoices where status = 'paid' (this month)
    supabase
      .from('invoices')
      .select('total')
      .eq('status', 'paid')
      .gte('updated_at', monthStart)
      .lte('updated_at', monthEnd),

    // outstanding: SUM of total from invoices where status IN ('sent', 'overdue')
    supabase
      .from('invoices')
      .select('total')
      .in('status', ['sent', 'overdue']),

    // total_expenses: SUM of amount from expenses where status = 'approved' (this month)
    supabase
      .from('expenses')
      .select('amount')
      .eq('status', 'approved')
      .gte('expense_date', monthStart)
      .lte('expense_date', monthEnd),

    // invoice_count: count of invoices
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true }),

    // expense_count: count of expenses
    supabase
      .from('expenses')
      .select('id', { count: 'exact', head: true }),

    // overdue_count: count of invoices where status = 'overdue'
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'overdue'),
  ]);

  if (paidThisMonthRes.error) return dbError(paidThisMonthRes.error, 'Failed to fetch stats');
  if (outstandingRes.error) return dbError(outstandingRes.error, 'Failed to fetch stats');
  if (expensesThisMonthRes.error) return dbError(expensesThisMonthRes.error, 'Failed to fetch stats');

  const total_revenue = (paidThisMonthRes.data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  const outstanding = (outstandingRes.data ?? []).reduce((sum, inv) => sum + (inv.total ?? 0), 0);
  const total_expenses = (expensesThisMonthRes.data ?? []).reduce((sum, exp) => sum + (exp.amount ?? 0), 0);
  const profit = total_revenue - total_expenses;

  return NextResponse.json({
    success: true,
    data: {
      total_revenue,
      outstanding,
      total_expenses,
      profit,
      invoice_count: invoiceCountRes.count ?? 0,
      expense_count: expenseCountRes.count ?? 0,
      overdue_count: overdueCountRes.count ?? 0,
    },
  });
}
