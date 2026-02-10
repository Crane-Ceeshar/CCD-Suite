import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { widgetCreateSchema, widgetUpdateSchema, widgetDeleteSchema } from '@/lib/api/schemas/analytics';

/**
 * POST /api/analytics/dashboards/:id/widgets
 * Add a widget to a dashboard.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id: dashboardId } = await params;

  const { data: body, error: bodyError } = await validateBody(request, widgetCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('widgets')
    .insert({
      dashboard_id: dashboardId,
      title: body.title,
      widget_type: body.widget_type,
      data_source: body.data_source,
      config: body.config,
      position: body.position,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create widget');
  }

  return success(data, 201);
}

/**
 * PATCH /api/analytics/dashboards/:id/widgets
 * Update a widget's config. Requires `widgetId` in body.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id: dashboardId } = await params;

  const { data: body, error: bodyError } = await validateBody(request, widgetUpdateSchema);
  if (bodyError) return bodyError;

  const updateFields: Record<string, unknown> = {};
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.widget_type !== undefined) updateFields.widget_type = body.widget_type;
  if (body.data_source !== undefined) updateFields.data_source = body.data_source;
  if (body.config !== undefined) updateFields.config = body.config;
  if (body.position !== undefined) updateFields.position = body.position;

  const { data, error: updateError } = await supabase
    .from('widgets')
    .update(updateFields)
    .eq('id', body.widgetId)
    .eq('dashboard_id', dashboardId)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Widget');
  }

  return success(data);
}

/**
 * DELETE /api/analytics/dashboards/:id/widgets
 * Remove a widget. Requires `widgetId` in body.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id: dashboardId } = await params;

  const { data: body, error: bodyError } = await validateBody(request, widgetDeleteSchema);
  if (bodyError) return bodyError;

  const { error: deleteError } = await supabase
    .from('widgets')
    .delete()
    .eq('id', body.widgetId)
    .eq('dashboard_id', dashboardId);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete widget');
  }

  return success({ deleted: true });
}
