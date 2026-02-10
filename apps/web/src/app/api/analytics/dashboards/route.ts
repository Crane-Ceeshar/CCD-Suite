import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { dashboardCreateSchema } from '@/lib/api/schemas/analytics';

/**
 * GET /api/analytics/dashboards
 * List dashboards for the current tenant.
 */
export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('dashboards')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (queryError) {
    return dbError(queryError, 'Failed to fetch dashboards');
  }

  return success(data);
}

/**
 * POST /api/analytics/dashboards
 * Create a new dashboard.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, dashboardCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('dashboards')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      is_default: body.is_default,
      layout: body.layout,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create dashboard');
  }

  return success(data, 201);
}
