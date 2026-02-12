import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createDepartmentSchema, departmentListQuerySchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { sanitizeObject, sanitizeSearchQuery } from '@/lib/api/sanitize';

/**
 * GET /api/hr/departments
 * List departments with head employee join and employee counts.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'hr:departments:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    departmentListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('departments')
    .select(
      '*, head:employees!head_id(id, first_name, last_name, job_title, avatar_url)',
      { count: 'exact' }
    )
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (search) {
    const safe = sanitizeSearchQuery(search);
    dbQuery = dbQuery.ilike('name', `%${safe}%`);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch departments');
  }

  // Count employees per department
  const { data: empCounts, error: countError } = await supabase
    .from('employees')
    .select('department_id')
    .in('status', ['active', 'on_leave']);

  if (countError) {
    return dbError(countError, 'Failed to fetch employee counts');
  }

  const countMap = new Map<string, number>();
  for (const row of empCounts ?? []) {
    if (row.department_id) {
      countMap.set(row.department_id, (countMap.get(row.department_id) ?? 0) + 1);
    }
  }

  const enriched = (data ?? []).map((dept) => ({
    ...dept,
    employee_count: countMap.get(dept.id) ?? 0,
  }));

  return NextResponse.json({ success: true, data: enriched, count });
}

/**
 * POST /api/hr/departments
 * Create a new department.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'hr:departments:create' });
  if (limited) return limitResp!;

  const { data: rawBody, error: bodyError } = await validateBody(request, createDepartmentSchema);
  if (bodyError) return bodyError;
  const body = sanitizeObject(rawBody as Record<string, unknown>) as typeof rawBody;

  const { data: department, error: insertError } = await supabase
    .from('departments')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      head_id: body.head_id ?? null,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create department');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'department.created',
    resource_type: 'department',
    resource_id: department.id,
    details: { name: body.name },
  });

  return success(department, 201);
}
