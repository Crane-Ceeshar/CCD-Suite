import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { processPayrollSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * POST /api/hr/payroll/:id/process
 * Payroll workflow engine — process, complete, or cancel a payroll run.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'hr:payroll:process' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, processPayrollSchema);
  if (bodyError) return bodyError;

  const { action } = body;

  // Fetch the payroll run to verify current status
  const { data: run, error: fetchError } = await supabase
    .from('payroll_runs')
    .select('id, status, currency')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Payroll run');
  }

  if (action === 'process') {
    if (run.status !== 'draft') {
      return errorResponse('Only draft payroll runs can be processed', 400);
    }

    // Fetch all active employees with salary
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, salary, salary_currency')
      .eq('status', 'active')
      .not('salary', 'is', null);

    if (empError) {
      return dbError(empError, 'Failed to fetch employees');
    }

    if (!employees || employees.length === 0) {
      return errorResponse('No active employees with salary found', 400);
    }

    // Calculate payroll items for each employee
    const payrollItems = employees.map((emp) => {
      const gross = emp.salary as number;
      const deductions = Math.round(gross * 0.25 * 100) / 100;
      const net = Math.round((gross - deductions) * 100) / 100;

      return {
        payroll_run_id: id,
        employee_id: emp.id,
        gross_pay: gross,
        deductions,
        net_pay: net,
        currency: emp.salary_currency || run.currency || 'USD',
        breakdown: {
          tax: Math.round(gross * 0.15 * 100) / 100,
          benefits: Math.round(gross * 0.10 * 100) / 100,
        },
      };
    });

    // Insert all payroll items
    const { error: itemsInsertError } = await supabase
      .from('payroll_items')
      .insert(payrollItems);

    if (itemsInsertError) {
      return dbError(itemsInsertError, 'Failed to create payroll items');
    }

    // Calculate totals
    const total_gross = payrollItems.reduce((sum, item) => sum + item.gross_pay, 0);
    const total_deductions = payrollItems.reduce((sum, item) => sum + item.deductions, 0);
    const total_net = payrollItems.reduce((sum, item) => sum + item.net_pay, 0);

    // Update the run
    const { data: updatedRun, error: updateError } = await supabase
      .from('payroll_runs')
      .update({
        status: 'processing',
        total_gross: Math.round(total_gross * 100) / 100,
        total_deductions: Math.round(total_deductions * 100) / 100,
        total_net: Math.round(total_net * 100) / 100,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return dbError(updateError, 'Failed to update payroll run');
    }

    logAudit(supabase, profile.tenant_id, user.id, {
      action: 'payroll.processing',
      resource_type: 'payroll_run',
      resource_id: id,
      details: { employee_count: employees.length, total_gross, total_deductions, total_net },
    });

    return success(updatedRun);
  }

  if (action === 'complete') {
    if (run.status !== 'processing') {
      return errorResponse('Only processing payroll runs can be completed', 400);
    }

    const { data: updatedRun, error: updateError } = await supabase
      .from('payroll_runs')
      .update({
        status: 'completed',
        processed_by: user.id,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return dbError(updateError, 'Failed to complete payroll run');
    }

    logAudit(supabase, profile.tenant_id, user.id, {
      action: 'payroll.completed',
      resource_type: 'payroll_run',
      resource_id: id,
    });

    return success(updatedRun);
  }

  if (action === 'cancel') {
    if (run.status === 'completed') {
      return errorResponse('Completed payroll runs cannot be cancelled', 400);
    }

    // Delete all payroll items for this run
    const { error: deleteError } = await supabase
      .from('payroll_items')
      .delete()
      .eq('payroll_run_id', id);

    if (deleteError) {
      return dbError(deleteError, 'Failed to delete payroll items');
    }

    // Update the run
    const { data: updatedRun, error: updateError } = await supabase
      .from('payroll_runs')
      .update({
        status: 'cancelled',
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return dbError(updateError, 'Failed to cancel payroll run');
    }

    logAudit(supabase, profile.tenant_id, user.id, {
      action: 'payroll.cancelled',
      resource_type: 'payroll_run',
      resource_id: id,
    });

    return success(updatedRun);
  }

  return errorResponse('Invalid action', 400);
}
