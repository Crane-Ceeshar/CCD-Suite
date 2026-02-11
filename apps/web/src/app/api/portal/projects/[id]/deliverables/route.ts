import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { createDeliverableSchema } from '@/lib/api/schemas/portal';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';

/**
 * GET /api/portal/projects/:id/deliverables
 * List deliverables for a portal project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('portal_deliverables')
    .select('*')
    .eq('portal_project_id', id)
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch deliverables');
  }

  return success(data);
}

/**
 * POST /api/portal/projects/:id/deliverables
 * Upload / create a deliverable.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 50, keyPrefix: 'portal:deliverables:create' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, createDeliverableSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('portal_deliverables')
    .insert({
      tenant_id: profile.tenant_id,
      portal_project_id: id,
      title: body.title,
      description: body.description ?? null,
      file_url: body.file_url ?? null,
      file_name: body.file_name ?? null,
      file_size: body.file_size ?? null,
      status: 'pending_review',
      uploaded_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create deliverable');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'portal_deliverable.created',
    resource_type: 'portal_deliverable',
    resource_id: data.id,
    details: { title: data.title, portal_project_id: id },
  });

  return success(data, 201);
}
