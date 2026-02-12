import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { id } = await params;

  // Verify automation belongs to tenant
  const { data: automation } = await supabase
    .from('ai_automations')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!automation) {
    return error('Automation not found', 404);
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 50);
  const offset = (page - 1) * limit;

  const { data: runs, error: runsErr } = await supabase
    .from('ai_automation_runs')
    .select('*', { count: 'exact' })
    .eq('automation_id', id)
    .eq('tenant_id', profile.tenant_id)
    .order('started_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (runsErr) {
    return error('Failed to load automation runs', 500);
  }

  return success({ runs: runs ?? [], total: runs?.length ?? 0 });
}
