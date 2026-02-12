import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { checkTokenBudget, trackTokenUsage, isFeatureEnabled } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

const VALID_CATEGORIES = ['crm', 'analytics', 'seo', 'finance', 'social'] as const;

export async function GET(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const isRead = searchParams.get('is_read');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  let query = supabase
    .from('ai_insights')
    .select('*', { count: 'exact' })
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category && VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    query = query.eq('category', category);
  }
  if (isRead === 'true') {
    query = query.eq('is_read', true);
  } else if (isRead === 'false') {
    query = query.eq('is_read', false);
  }

  const { data, error: queryErr, count } = await query;

  if (queryErr) {
    return error('Failed to fetch insights', 500);
  }

  return success({ insights: data ?? [], total: count ?? 0 });
}

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  // Check feature enabled
  const insightsEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'insights');
  if (!insightsEnabled) {
    return error('AI Insights is not enabled for your organization', 403);
  }

  // Check token budget
  const budget = await checkTokenBudget(supabase, profile.tenant_id);
  if (!budget.allowed) {
    return error('Monthly AI token budget exceeded. Contact your administrator.', 429);
  }

  let body: { category?: string };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.category || !VALID_CATEGORIES.includes(body.category as (typeof VALID_CATEGORIES)[number])) {
    return error(`category must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }

  // Call AI gateway to generate insights
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${GATEWAY_URL}/ai/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({ category: body.category }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return error(
        (errData as Record<string, unknown>)?.message as string || 'Failed to generate insights',
        res.status >= 500 ? 503 : res.status
      );
    }

    const data = await res.json();
    const insights = data.insights ?? data.data ?? [];

    // Persist insights to database
    if (Array.isArray(insights) && insights.length > 0) {
      const insightRows = insights.map((insight: Record<string, unknown>) => ({
        tenant_id: profile.tenant_id,
        category: body.category,
        type: insight.type ?? 'general',
        title: insight.title ?? 'Insight',
        summary: insight.summary ?? '',
        details: insight.details ?? {},
        entity_id: insight.entity_id ?? null,
        entity_type: insight.entity_type ?? null,
      }));

      const { data: saved, error: insertErr } = await supabase
        .from('ai_insights')
        .insert(insightRows)
        .select('*');

      if (insertErr) {
        return error('Insights generated but failed to save', 500);
      }

      // Track token usage if returned
      const tokensUsed = data.tokens_used as number | undefined;
      if (tokensUsed && tokensUsed > 0) {
        trackTokenUsage(supabase, profile.tenant_id, tokensUsed).catch(() => {});
      }

      return success(saved, 201);
    }

    return success([], 201);
  } catch {
    return error('AI service unavailable. Please ensure the AI gateway is running.', 503);
  }
}
