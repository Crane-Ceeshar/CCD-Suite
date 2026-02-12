import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateEmployeeSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/employees/:id
 * Fetch a single employee with department, manager, recent leave requests, and attendance.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:employees:get' });
  if (limited) return limitResp!;

  const [employeeRes, leaveRes, attendanceRes] = await Promise.all([
    supabase
      .from('employees')
      .select('*, department:departments!department_id(*), manager:employees!manager_id(id, first_name, last_name)')
      .eq('id', id)
      .single(),
    supabase
      .from('leave_requests')
      .select('*')
      .eq('employee_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', id)
      .order('date', { ascending: false })
      .limit(30),
  ]);

  if (employeeRes.error) {
    return dbError(employeeRes.error, 'Employee');
  }

  return success({
    ...employeeRes.data,
    recent_leave_requests: leaveRes.data ?? [],
    recent_attendance: attendanceRes.data ?? [],
  });
}

/**
 * PATCH /api/hr/employees/:id
 * Update an employee.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:employees:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateEmployeeSchema);
  if (bodyError) return bodyError;

  // Build update fields — only include provided fields
  const updateFields: Record<string, unknown> = {};
  const allowedFields = [
    'first_name', 'last_name', 'email', 'phone', 'department_id',
    'job_title', 'employment_type', 'status', 'salary', 'salary_currency',
    'manager_id', 'address', 'emergency_contact_name', 'emergency_contact_phone',
    'notes', 'termination_date',
  ] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  // If status changes to terminated, auto-set termination_date to today
  if (updateFields.status === 'terminated' && !updateFields.termination_date) {
    updateFields.termination_date = new Date().toISOString().split('T')[0];
  }

  const { data, error: updateError } = await supabase
    .from('employees')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Employee');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'employee.updated',
    resource_type: 'employee',
    resource_id: id,
    details: { fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/hr/employees/:id
 * Soft-delete an employee (set status to terminated).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:employees:delete' });
  if (limited) return limitResp!;

  // Verify employee exists
  const { data: employee, error: fetchError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Employee');
  }

  if (employee.status === 'terminated') {
    return errorResponse('Employee is already terminated', 400);
  }

  // Soft-delete: update status to terminated and set termination_date
  const { data, error: updateError } = await supabase
    .from('employees')
    .update({
      status: 'terminated',
      termination_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to terminate employee');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'employee.terminated',
    resource_type: 'employee',
    resource_id: id,
    details: { first_name: employee.first_name, last_name: employee.last_name },
  });

  return success(data);
}
