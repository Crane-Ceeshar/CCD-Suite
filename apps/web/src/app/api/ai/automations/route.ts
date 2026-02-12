import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error, dbError } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

const VALID_TYPES = [
  'expense_categorization',
  'seo_recommendations',
  'sentiment_analysis',
  'deal_scoring',
  'content_suggestions',
] as const;

export async function GET(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { searchParams } = new URL(request.url);
  const isEnabled = searchParams.get('is_enabled');

  let query = supabase
    .from('ai_automations')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('type', { ascending: true });

  if (isEnabled !== null) {
    query = query.eq('is_enabled', isEnabled === 'true');
  }

  const { data, error: queryErr } = await query;

  if (queryErr) return dbError(queryErr, 'Failed to fetch AI automations');

  return success(data);
}

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  let body: { type: string; name: string; description?: string; config?: object; is_enabled?: boolean };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.type || !VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) {
    return error(`type must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }

  if (!body.name || !body.name.trim()) {
    return error('name is required', 400);
  }

  const { data, error: insertErr } = await supabase
    .from('ai_automations')
    .insert({
      tenant_id: profile.tenant_id,
      type: body.type,
      name: body.name.trim(),
      description: body.description ?? null,
      config: body.config ?? {},
      is_enabled: body.is_enabled ?? false,
    })
    .select('*')
    .single();

  if (insertErr) return dbError(insertErr, 'Failed to create AI automation');

  return success(data, 201);
}
