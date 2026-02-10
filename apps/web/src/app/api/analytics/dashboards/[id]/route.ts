import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { dashboardUpdateSchema } from '@/lib/api/schemas/analytics';

/**
 * GET /api/analytics/dashboards/:id
 * Get a dashboard with its widgets.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Dashboard');
  }

  // Fetch widgets
  const { data: widgets } = await supabase
    .from('widgets')
    .select('*')
    .eq('dashboard_id', id)
    .order('created_at', { ascending: true });

  return success({ ...data, widgets: widgets ?? [] });
}

/**
 * PATCH /api/analytics/dashboards/:id
 * Update dashboard.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, dashboardUpdateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.layout !== undefined) updateFields.layout = body.layout;
  if (body.is_default !== undefined) updateFields.is_default = body.is_default;

  const { data, error: updateError } = await supabase
    .from('dashboards')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Dashboard');
  }

  // Fire-and-forget audit log
  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'dashboard.updated',
    resource_type: 'dashboard',
    resource_id: id,
    details: { name: data.name, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/analytics/dashboards/:id
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  // Delete widgets first
  await supabase.from('widgets').delete().eq('dashboard_id', id);

  const { error: deleteError } = await supabase
    .from('dashboards')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete dashboard');
  }

  // Fire-and-forget audit log
  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'dashboard.deleted',
    resource_type: 'dashboard',
    resource_id: id,
  });

  return success({ deleted: true });
}
