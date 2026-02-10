import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { alertCreateSchema } from '@/lib/api/schemas/analytics-advanced';

/**
 * GET /api/analytics/alerts
 * List all alerts for the current tenant.
 */
export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('analytics_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch alerts');
  }

  return success(data);
}

/**
 * POST /api/analytics/alerts
 * Create a new alert.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, alertCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('analytics_alerts')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      metric_key: body.metric_key,
      condition: body.condition,
      threshold: body.threshold,
      channel: body.channel,
      recipients: body.recipients,
      is_active: body.is_active,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create alert');
  }

  return success(data, 201);
}
