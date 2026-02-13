import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { checkTokenBudget, trackTokenUsage, isFeatureEnabled, getAiSettings } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

const VALID_TYPES = [
  'blog_post',
  'social_caption',
  'ad_copy',
  'email_draft',
  'seo_description',
  'summary',
  'custom',
] as const;

export async function POST(request: NextRequest) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  // Check feature enabled
  const genEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'content_generation');
  if (!genEnabled) {
    return error('Content generation is not enabled for your organization', 403);
  }

  // Check token budget
  const budget = await checkTokenBudget(supabase, profile.tenant_id);
  if (!budget.allowed) {
    return error('Monthly AI token budget exceeded. Contact your administrator.', 429);
  }

  let body: { type?: string; prompt?: string; context?: Record<string, unknown>; max_tokens?: number };
  try {
    body = await request.json();
  } catch {
    return error('Invalid JSON body', 400);
  }

  if (!body.type || !VALID_TYPES.includes(body.type as (typeof VALID_TYPES)[number])) {
    return error(`type must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!body.prompt?.trim()) {
    return error('prompt is required', 400);
  }

  // Create generation job record
  const { data: job, error: jobErr } = await supabase
    .from('ai_generation_jobs')
    .insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      type: body.type,
      prompt: body.prompt.trim(),
      status: 'processing',
      metadata: body.context ?? {},
    })
    .select('id')
    .single();

  if (jobErr) {
    return error('Failed to create generation job', 500);
  }

  // Fetch tenant AI settings for model preference
  const aiSettings = await getAiSettings(supabase, profile.tenant_id);

  // Call AI gateway
  let result: string;
  let model: string = 'unknown';
  let tokensUsed: number | null = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`${GATEWAY_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        type: body.type,
        prompt: body.prompt.trim(),
        context: body.context,
        max_tokens: body.max_tokens,
        model: aiSettings.preferred_model,
      }),
    });

    if (!res.ok) {
      // Update job as failed
      await supabase
        .from('ai_generation_jobs')
        .update({ status: 'failed' })
        .eq('id', job.id);

      const errData = await res.json().catch(() => ({}));
      return error(
        (errData as Record<string, unknown>)?.message as string || 'AI service returned an error',
        res.status >= 500 ? 503 : res.status
      );
    }

    const data = await res.json();
    result = data.result ?? data.content ?? data.text ?? '';
    model = data.model ?? 'unknown';
    tokensUsed = data.tokens_used ?? null;
  } catch {
    // Update job as failed
    await supabase
      .from('ai_generation_jobs')
      .update({ status: 'failed' })
      .eq('id', job.id);

    return error('AI service unavailable. Please ensure the AI gateway is running.', 503);
  }

  // Update job with results
  await supabase
    .from('ai_generation_jobs')
    .update({
      status: 'completed',
      result,
      model,
      tokens_used: tokensUsed,
    })
    .eq('id', job.id);

  // Track token usage (fire-and-forget)
  if (tokensUsed && tokensUsed > 0) {
    trackTokenUsage(supabase, profile.tenant_id, tokensUsed, user.id, model, 'generation').catch(() => {});
  }

  return success({ result, model, tokens_used: tokensUsed });
}
