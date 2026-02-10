import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResp, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { customMetricUpdateSchema } from '@/lib/api/schemas/analytics-advanced';
import { validateFormula, evaluateFormula, extractVariables } from '@/lib/analytics/formula-parser';
import { getPeriodStart } from '@/lib/analytics/period-helpers';

/**
 * GET /api/analytics/custom-metrics/:id
 * Fetch a single custom metric and evaluate its formula with real data.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: metric, error: queryError } = await supabase
    .from('analytics_custom_metrics')
    .select('*')
    .eq('id', id)
    .single();

  if (queryError) {
    return dbError(queryError, 'Custom metric');
  }

  // Evaluate formula with real data
  const variables = extractVariables(metric.formula);
  const since = getPeriodStart('30d');
  const context: Record<string, number> = {};

  // Fetch data for known variables
  if (variables.includes('revenue') || variables.includes('deals_won')) {
    const { data: deals } = await supabase
      .from('deals')
      .select('value, status')
      .eq('status', 'won')
      .gte('actual_close_date', since);

    const wonDeals = deals ?? [];
    context.revenue = wonDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    context.deals_won = wonDeals.length;
  }

  if (variables.includes('pipeline_value') || variables.includes('active_deals')) {
    const { data: openDeals } = await supabase
      .from('deals')
      .select('value')
      .eq('status', 'open')
      .gte('created_at', since);

    const deals = openDeals ?? [];
    context.pipeline_value = deals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    context.active_deals = deals.length;
  }

  if (
    variables.includes('engagement') ||
    variables.includes('impressions') ||
    variables.includes('likes') ||
    variables.includes('comments') ||
    variables.includes('shares')
  ) {
    const { data: engagement } = await supabase
      .from('social_engagement')
      .select('likes, comments, shares, impressions')
      .gte('recorded_at', since);

    const rows = engagement ?? [];
    context.likes = rows.reduce((s, e) => s + (e.likes ?? 0), 0);
    context.comments = rows.reduce((s, e) => s + (e.comments ?? 0), 0);
    context.shares = rows.reduce((s, e) => s + (e.shares ?? 0), 0);
    context.engagement = context.likes + context.comments + context.shares;
    context.impressions = rows.reduce((s, e) => s + (e.impressions ?? 0), 0);
  }

  if (variables.includes('content_count')) {
    const { count } = await supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    context.content_count = count ?? 0;
  }

  if (variables.includes('audit_score')) {
    const { data: audits } = await supabase
      .from('seo_audits')
      .select('score')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    context.audit_score = audits && audits.length > 0 ? audits[0].score : 0;
  }

  const computedValue = evaluateFormula(metric.formula, context);

  return success({
    ...metric,
    computed_value: computedValue,
    variables: context,
  });
}

/**
 * PATCH /api/analytics/custom-metrics/:id
 * Update a custom metric. Re-validates formula if provided.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { data: body, error: bodyError } = await validateBody(request, customMetricUpdateSchema);
  if (bodyError) return bodyError;

  // Validate formula if provided
  if (body.formula !== undefined) {
    const formulaValidation = validateFormula(body.formula);
    if (!formulaValidation.valid) {
      return errorResp(
        `Invalid formula: ${(formulaValidation as { valid: false; error: string }).error}`,
        400
      );
    }
  }

  const updateFields: Record<string, unknown> = {};
  if (body.name !== undefined) updateFields.name = body.name;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.formula !== undefined) updateFields.formula = body.formula;
  if (body.format !== undefined) updateFields.format = body.format;

  const { data, error: updateError } = await supabase
    .from('analytics_custom_metrics')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Custom metric');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'custom_metric.updated',
    resource_type: 'analytics_custom_metric',
    resource_id: id,
    details: { name: data.name, fields: Object.keys(updateFields) },
  });

  return success(data);
}

/**
 * DELETE /api/analytics/custom-metrics/:id
 * Delete a custom metric.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  const { error: deleteError } = await supabase
    .from('analytics_custom_metrics')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return dbError(deleteError, 'Failed to delete custom metric');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'custom_metric.deleted',
    resource_type: 'analytics_custom_metric',
    resource_id: id,
  });

  return success({ deleted: true });
}
