import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { alertUpdateSchema } from '@/lib/api/schemas/analytics-advanced';

/**
 * GET /api/analytics/alerts/:id
 * Fetch a single alert by id.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('analytics_alerts')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Alert');
  }

  return success(data);
}

/**
 * PATCH /api/analytics/alerts/:id
 * Update an alert.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, alertUpdateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.metric_key !== undefined) updateFields.metric_key = body.metric_key;
  if (body.condition !== undefined) updateFields.condition = body.condition;
  if (body.threshold !== undefined) updateFields.threshold = body.threshold;
  if (body.channel !== undefined) updateFields.channel = body.channel;
  if (body.recipients !== undefined) updateFields.recipients = body.recipients;
  if (body.is_active !== undefined) updateFields.is_active = body.is_active;

  const { data, error: updateError } = await supabase
    .from('analytics_alerts')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Alert');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'alert.updated',
    resource_type: 'analytics_alert',
    resource_id: id,
    details: { name: data.name, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/analytics/alerts/:id
 * Delete an alert.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { error: deleteError } = await supabase
    .from('analytics_alerts')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete alert');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'alert.deleted',
    resource_type: 'analytics_alert',
    resource_id: id,
  });

  return success({ deleted: true });
}
