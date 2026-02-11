import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createExpenseSchema, expenseListQuerySchema } from '@/lib/api/schemas/finance';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/finance/expenses
 * List expenses with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:expenses:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    expenseListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, category, from, to, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('expenses')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }
  if (search) {
    dbQuery = dbQuery.or(`description.ilike.%${search}%,vendor.ilike.%${search}%`);
  }
  if (from) {
    dbQuery = dbQuery.gte('expense_date', from);
  }
  if (to) {
    dbQuery = dbQuery.lte('expense_date', to);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch expenses');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/finance/expenses
 * Create a new expense.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'finance:expenses:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createExpenseSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('expenses')
    .insert({
      tenant_id: profile.tenant_id,
      category: body.category,
      vendor: body.vendor ?? null,
      description: body.description,
      amount: body.amount,
      currency: body.currency,
      expense_date: body.expense_date ?? null,
      receipt_url: body.receipt_url ?? null,
      notes: body.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create expense');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'expense.created',
    resource_type: 'expense',
    resource_id: data.id,
    details: { description: data.description, amount: data.amount },
  });

  return success(data, 201);
}
