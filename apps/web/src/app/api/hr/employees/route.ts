import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createEmployeeSchema, employeeListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/hr/employees
 * List employees with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:employees:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    employeeListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, department_id, employment_type, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('employees')
    .select(
      '*, department:departments!department_id(id, name), manager:employees!manager_id(id, first_name, last_name)',
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (search) {
    dbQuery = dbQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (department_id) {
    dbQuery = dbQuery.eq('department_id', department_id);
  }
  if (employment_type) {
    dbQuery = dbQuery.eq('employment_type', employment_type);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch employees');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/hr/employees
 * Create a new employee.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:employees:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createEmployeeSchema);
  if (bodyError) return bodyError;

  const { data: employee, error: insertError } = await supabase
    .from('employees')
    .insert({
      tenant_id: profile.tenant_id,
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email ?? null,
      phone: body.phone ?? null,
      department_id: body.department_id ?? null,
      job_title: body.job_title ?? null,
      employment_type: body.employment_type,
      hire_date: body.hire_date ?? new Date().toISOString().split('T')[0],
      salary: body.salary ?? null,
      salary_currency: body.salary_currency,
      manager_id: body.manager_id ?? null,
      address: body.address ?? null,
      emergency_contact_name: body.emergency_contact_name ?? null,
      emergency_contact_phone: body.emergency_contact_phone ?? null,
      notes: body.notes ?? null,
      status: 'active',
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create employee');
  }

  // Re-fetch with department join
  const { data: fullEmployee, error: fetchError } = await supabase
    .from('employees')
    .select('*, department:departments!department_id(id, name), manager:employees!manager_id(id, first_name, last_name)')
    .eq('id', employee.id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Failed to fetch created employee');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'employee.created',
    resource_type: 'employee',
    resource_id: employee.id,
    details: { first_name: body.first_name, last_name: body.last_name },
  });

  return success(fullEmployee, 201);
}
