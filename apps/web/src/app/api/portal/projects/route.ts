import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody, validateQuery } from '@/lib/api/validate';
import { createPortalProjectSchema, portalProjectListQuerySchema } from '@/lib/api/schemas/portal';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/portal/projects
 * List portal projects with milestone/deliverable counts.
 */
export async function GET(request: NextRequest) {
  const { error, supabase, user } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 100, keyPrefix: 'portal:projects:list' });
  if (limited) return limitResp!;

  const { data: query, error: queryValidationError } = validateQuery(
    request.nextUrl.searchParams,
    portalProjectListQuerySchema
  );
  if (queryValidationError) return queryValidationError;

  const { search, status, client_id, sort: sortBy, dir, limit, offset } = query!;
  const sortDir = dir === 'asc';

  let dbQuery = supabase
    .from('portal_projects')
    .select('*', { count: 'exact' })
    .order(sortBy, { ascending: sortDir })
    .range(offset, offset + limit - 1);

  if (status) dbQuery = dbQuery.eq('status', status);
  if (client_id) dbQuery = dbQuery.eq('client_id', client_id);
  if (search) {
    dbQuery = dbQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  const { data, error: queryError, count } = await dbQuery;

  if (queryError) {
    return dbError(queryError, 'Failed to fetch portal projects');
  }

  // Get milestone and deliverable counts for each project
  if (data && data.length > 0) {
    const projectIds = data.map((p: { id: string }) => p.id);

    const [milestonesRes, deliverablesRes] = await Promise.all([
      supabase.from('portal_milestones').select('portal_project_id').in('portal_project_id', projectIds),
      supabase.from('portal_deliverables').select('portal_project_id').in('portal_project_id', projectIds),
    ]);

    const milestoneCountMap = new Map<string, number>();
    (milestonesRes.data ?? []).forEach((m: { portal_project_id: string }) => {
      milestoneCountMap.set(m.portal_project_id, (milestoneCountMap.get(m.portal_project_id) ?? 0) + 1);
    });

    const deliverableCountMap = new Map<string, number>();
    (deliverablesRes.data ?? []).forEach((d: { portal_project_id: string }) => {
      deliverableCountMap.set(d.portal_project_id, (deliverableCountMap.get(d.portal_project_id) ?? 0) + 1);
    });

    data.forEach((project: { id: string; milestone_count?: number; deliverable_count?: number }) => {
      project.milestone_count = milestoneCountMap.get(project.id) ?? 0;
      project.deliverable_count = deliverableCountMap.get(project.id) ?? 0;
    });
  }

  return NextResponse.json({ success: true, data, count });
}

/**
 * POST /api/portal/projects
 * Create a new portal project.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'portal:projects:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createPortalProjectSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('portal_projects')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      project_id: body.project_id ?? null,
      client_id: body.client_id ?? null,
      status: body.status,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      budget: body.budget ?? null,
      progress: 0,
      metadata: body.metadata,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create portal project');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_project.created',
    resource_type: 'portal_project',
    resource_id: data.id,
    details: { name: data.name },
  });

  return success(data, 201);
}
