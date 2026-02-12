import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResponse, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { updateDepartmentSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/departments/:id
 * Fetch a single department with head and employees list.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:departments:get' });
  if (limited) return limitResp!;

  const [deptRes, employeesRes] = await Promise.all([
    supabase
      .from('departments')
      .select('*, head:employees!head_id(id, first_name, last_name, job_title, avatar_url)')
      .eq('id', id)
      .single(),
    supabase
      .from('employees')
      .select('id, first_name, last_name, job_title, email, status, avatar_url')
      .eq('department_id', id)
      .in('status', ['active', 'on_leave'])
      .order('last_name', { ascending: true }),
  ]);

  if (deptRes.error) {
    return dbError(deptRes.error, 'Department');
  }

  return success({
    ...deptRes.data,
    employees: employeesRes.data ?? [],
  });
}

/**
 * PATCH /api/hr/departments/:id
 * Update a department.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:departments:update' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, updateDepartmentSchema);
  if (bodyError) return bodyError;

  // Build update fields — only include provided fields
  const updateFields: Record<string, unknown> = {};
  const allowedFields = ['name', 'description', 'head_id'] as const;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateFields[field] = body[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return errorResponse('No fields to update', 400);
  }

  const { data, error: updateError } = await supabase
    .from('departments')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Department');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'department.updated',
    resource_type: 'department',
    resource_id: id,
    details: { fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/hr/departments/:id
 * Delete a department (only if no employees are assigned).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:departments:delete' });
  if (limited) return limitResp!;

  // Verify department exists
  const { data: department, error: fetchError } = await supabase
    .from('departments')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Department');
  }

  // Check if any employees are assigned to this department
  const { count, error: countError } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('department_id', id);

  if (countError) {
    return dbError(countError, 'Failed to check department employees');
  }

  if (count && count > 0) {
    return errorResponse(
      `Cannot delete department with ${count} assigned employee(s). Reassign them first.`,
      400
    );
  }

  const { error: deleteError } = await supabase
    .from('departments')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete department');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'department.deleted',
    resource_type: 'department',
    resource_id: id,
    details: { name: department.name },
  });

  return success({ deleted: true });
}
