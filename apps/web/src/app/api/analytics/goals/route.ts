import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { goalCreateSchema } from '@/lib/api/schemas/analytics-advanced';

/**
 * GET /api/analytics/goals
 * List all goals for the current tenant.
 */
export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('analytics_goals')
    .select('*')
    .order('created_at', { ascending: false });

  if (queryError) {
    return dbError(queryError, 'Failed to fetch goals');
  }

  return success(data);
}

/**
 * POST /api/analytics/goals
 * Create a new goal.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, goalCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('analytics_goals')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      metric_key: body.metric_key,
      target_value: body.target_value,
      current_value: body.current_value,
      period: body.period,
      start_date: body.start_date ?? null,
      end_date: body.end_date ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create goal');
  }

  return success(data, 201);
}
