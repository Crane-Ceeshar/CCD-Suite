import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateExpenseSchema } from '@/lib/api/schemas/finance';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/finance/expenses/:id
 * Get a single expense by ID.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: fetchError } = await supabase
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Expense');
  }

  return success(data);
}

/**
 * PATCH /api/finance/expenses/:id
 * Update an expense.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'finance:expenses:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateExpenseSchema);
  if (bodyError) return bodyError;

  // Build update fields — only include provided fields
  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'category', 'vendor', 'description', 'amount', 'currency',
    'expense_date', 'receipt_url', 'status', 'notes',
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
    .from('expenses')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Expense');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'expense.updated',
    resource_type: 'expense',
    resource_id: id,
    details: { description: data.description, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/finance/expenses/:id
 * Delete an expense (only if status is 'pending').
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Verify expense exists and check status
  const { data: expense, error: fetchError } = await supabase
    .from('expenses')
    .select('id, description, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Expense');
  }

  if (expense.status !== 'pending') {
    return errorResponse('Only pending expenses can be deleted', 400);
  }

  const { error: deleteError } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete expense');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'expense.deleted',
    resource_type: 'expense',
    resource_id: id,
    details: { description: expense.description },
  });

  return success({ deleted: true });
}
