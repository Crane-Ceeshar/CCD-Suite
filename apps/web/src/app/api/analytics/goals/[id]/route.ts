import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { goalUpdateSchema } from '@/lib/api/schemas/analytics-advanced';

/**
 * GET /api/analytics/goals/:id
 * Fetch a single goal by id.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data, error: queryError } = await supabase
    .from('analytics_goals')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Goal');
  }

  return success(data);
}

/**
 * PATCH /api/analytics/goals/:id
 * Update a goal.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, goalUpdateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.metric_key !== undefined) updateFields.metric_key = body.metric_key;
  if (body.target_value !== undefined) updateFields.target_value = body.target_value;
  if (body.current_value !== undefined) updateFields.current_value = body.current_value;
  if (body.period !== undefined) updateFields.period = body.period;
  if (body.start_date !== undefined) updateFields.start_date = body.start_date;
  if (body.end_date !== undefined) updateFields.end_date = body.end_date;
  if (body.status !== undefined) updateFields.status = body.status;

  const { data, error: updateError } = await supabase
    .from('analytics_goals')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Goal');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'goal.updated',
    resource_type: 'analytics_goal',
    resource_id: id,
    details: { name: data.name, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/analytics/goals/:id
 * Delete a goal.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { error: deleteError } = await supabase
    .from('analytics_goals')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete goal');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'goal.deleted',
    resource_type: 'analytics_goal',
    resource_id: id,
  });

  return success({ deleted: true });
}
