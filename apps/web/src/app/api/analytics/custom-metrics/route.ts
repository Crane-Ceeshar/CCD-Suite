import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResp, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { customMetricCreateSchema } from '@/lib/api/schemas/analytics-advanced';
import { validateFormula } from '@/lib/analytics/formula-parser';

/**
 * GET /api/analytics/custom-metrics
 * List custom metrics for the current tenant.
 */
export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('analytics_custom_metrics')
    .select('*')
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch custom metrics');
  }

  return success(data);
}

/**
 * POST /api/analytics/custom-metrics
 * Create a new custom metric. Validates the formula before saving.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, customMetricCreateSchema);
  if (bodyError) return bodyError;

  // Validate formula syntax
  const formulaValidation = validateFormula(body.formula);
  if (!formulaValidation.valid) {
    return errorResp(
      `Invalid formula: ${(formulaValidation as { valid: false; error: string }).error}`,
      400
    );
  }

  const { data, error: insertError } = await supabase
    .from('analytics_custom_metrics')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      formula: body.formula,
      format: body.format,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create custom metric');
  }

  return success(data, 201);
}
