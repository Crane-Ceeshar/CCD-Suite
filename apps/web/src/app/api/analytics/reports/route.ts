import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { reportCreateSchema } from '@/lib/api/schemas/analytics';

/**
 * GET /api/analytics/reports
 * List saved reports.
 */
export async function GET() {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('analytics_reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (queryError) {
    return dbError(queryError, 'Failed to fetch reports');
  }

  return success(data);
}

/**
 * POST /api/analytics/reports
 * Create a report and optionally run it.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, reportCreateSchema);
  if (bodyError) return bodyError;

  const { data, error: insertError } = await supabase
    .from('analytics_reports')
    .insert({
      tenant_id: profile.tenant_id,
      name: body.name,
      description: body.description ?? null,
      report_type: body.report_type,
      config: body.config,
      schedule: body.schedule ?? null,
      last_run_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError) {
    return dbError(insertError, 'Failed to create report');
  }

  return success(data, 201);
}
