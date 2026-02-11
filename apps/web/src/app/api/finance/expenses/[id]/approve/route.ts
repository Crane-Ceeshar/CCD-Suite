import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { approveExpenseSchema } from '@/lib/api/schemas/finance';
import { logAudit } from '@/lib/api/audit';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * POST /api/finance/expenses/:id/approve
 * Approve or reject an expense.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'finance:expenses:approve' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, approveExpenseSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};

  if (body.action === 'approve') {
    updateFields.status = 'approved';
    updateFields.approved_by = user.id;
  } else {
    updateFields.status = 'rejected';
  }

  if (body.notes !== undefined) {
    updateFields.notes = body.notes;
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
    action: body.action === 'approve' ? 'expense.approved' : 'expense.rejected',
    resource_type: 'expense',
    resource_id: id,
    details: { description: data.description, action: body.action },
  });

  return success(data);
}
