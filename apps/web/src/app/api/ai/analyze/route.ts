import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { checkTokenBudget, trackTokenUsage, isFeatureEnabled } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

const VALID_ANALYSES = ['sentiment', 'summary', 'categorize', 'keywords'] as const;

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  // Check feature enabled (analyze is part of content_generation feature)
  const enabled = await isFeatureEnabled(supabase, profile.tenant_id, 'content_generation');
  if (!enabled) {
    return error('AI analysis is not enabled for your organization', 403);
  }

  // Check token budget
  const budget = await checkTokenBudget(supabase, profile.tenant_id);
  if (!budget.allowed) {
    return error('Monthly AI token budget exceeded. Contact your administrator.', 429);
  }

  let body: { text?: string; analyses?: string[]; context?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.text?.trim()) {
    return error('text is required', 400);
  }
  if (!body.analyses || !Array.isArray(body.analyses) || body.analyses.length === 0) {
    return error(`analyses must be a non-empty array of: ${VALID_ANALYSES.join(', ')}`, 400);
  }

  const invalidAnalyses = body.analyses.filter(
    (a: string) => !VALID_ANALYSES.includes(a as (typeof VALID_ANALYSES)[number])
  );
  if (invalidAnalyses.length > 0) {
    return error(`Invalid analyses: ${invalidAnalyses.join(', ')}. Must be: ${VALID_ANALYSES.join(', ')}`, 400);
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${GATEWAY_URL}/ai/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        text: body.text.trim(),
        analyses: body.analyses,
        context: body.context,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return error(
        (errData as Record<string, unknown>)?.message as string || 'AI analysis failed',
        res.status >= 500 ? 503 : res.status
      );
    }

    const data = await res.json();

    // Track token usage (fire-and-forget)
    const tokensUsed = data.tokens_used as number | undefined;
    if (tokensUsed && tokensUsed > 0) {
      trackTokenUsage(supabase, profile.tenant_id, tokensUsed).catch(() => {});
    }

    return success({
      results: data.results ?? data,
      model: data.model ?? 'unknown',
      tokens_used: tokensUsed ?? null,
    });
  } catch {
    return error('AI service unavailable. Please ensure the AI gateway is running.', 503);
  }
}
