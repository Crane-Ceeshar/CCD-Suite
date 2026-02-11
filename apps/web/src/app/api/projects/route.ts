import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createProjectSchema, projectListQuerySchema } from '@/lib/api/schemas/projects';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/projects
 * List projects with filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'projects:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    projectListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, priority, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('projects')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }
  if (priority) {
    dbQuery = dbQuery.eq('priority', priority);
  }
  if (search) {
    dbQuery = dbQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch projects');
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/projects
 * Create a new project and auto-add creator as owner.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'projects:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createProjectSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('projects')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      status: body.status,
      priority: body.priority,
      start_date: body.start_date ?? null,
      due_date: body.due_date ?? null,
      budget: body.budget ?? null,
      currency: body.currency,
      color: body.color ?? null,
      client_id: body.client_id ?? null,
      metadata: body.metadata,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create project');
  }

  // Auto-add creator as owner
  await supabase.from('project_members').insert({
    tenant_id: profile.tenant_id,
    project_id: data.id,
    user_id: user.id,
    role: 'owner',
  });

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'project.created',
    resource_type: 'project',
    resource_id: data.id,
    details: { name: data.name },
  });

  return success(data, 201);
}
