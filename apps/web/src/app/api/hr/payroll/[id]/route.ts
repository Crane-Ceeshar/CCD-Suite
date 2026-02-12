import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/hr/payroll/:id
 * Fetch a single payroll run with its line items and employee details.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:payroll:get' });
  if (limited) return limitResp!;

  // Fetch the payroll run
  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('id', id)
    .single();

  if (runError) {
    return dbError(runError, 'Payroll run');
  }

  // Fetch payroll items with employee details
  const { data: items, error: itemsError } = await supabase
    .from('payroll_items')
    .select('*, employee:employees(id, first_name, last_name, job_title, department:departments!department_id(id, name))')
    .eq('payroll_run_id', id);

  if (itemsError) {
    return dbError(itemsError, 'Failed to fetch payroll items');
  }

  return success({ ...run, items: items ?? [] });
}
