import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';
import { checkTokenBudget, trackTokenUsage, isFeatureEnabled } from '@/lib/api/ai-tokens';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.aiHeavy);
  if (limited) return response!;

  // Check feature enabled
  const automationsEnabled = await isFeatureEnabled(supabase, profile.tenant_id, 'automations');
  if (!automationsEnabled) {
    return error('AI Automations are not enabled for your organization', 403);
  }

  // Check token budget
  const budget = await checkTokenBudget(supabase, profile.tenant_id);
  if (!budget.allowed) {
    return error('Monthly AI token budget exceeded.', 429);
  }

  const { id } = await params;

  // Verify automation belongs to tenant
  const { data: automation } = await supabase
    .from('ai_automations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!automation) {
    return error('Automation not found', 404);
  }

  // Create a run record
  const { data: run, error: runErr } = await supabase
    .from('ai_automation_runs')
    .insert({
      automation_id: id,
      tenant_id: profile.tenant_id,
      status: 'running',
    })
    .select('*')
    .single();

  if (runErr) {
    return error('Failed to create automation run', 500);
  }

  // Execute automation via gateway (fire and forget in background)
  (async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`${GATEWAY_URL}/api/ai/automation/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          automation_type: automation.type,
          automation_config: automation.config,
          tenant_id: profile.tenant_id,
        }),
      });

      if (!res.ok) {
        // Mark run as failed
        await supabase
          .from('ai_automation_runs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: 'Gateway returned an error',
          })
          .eq('id', run.id);
        return;
      }

      const data = await res.json();
      const tokensUsed = data.tokens_used ?? 0;
      const itemsProcessed = data.items_processed ?? 0;

      // Mark run as completed
      await supabase
        .from('ai_automation_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          result: data.result ?? {},
          tokens_used: tokensUsed,
          items_processed: itemsProcessed,
        })
        .eq('id', run.id);

      // Update automation's last_run_at
      await supabase
        .from('ai_automations')
        .update({ last_run_at: new Date().toISOString() })
        .eq('id', id);

      // Track token usage
      if (tokensUsed > 0) {
        trackTokenUsage(supabase, profile.tenant_id, tokensUsed, user.id, data.model ?? 'unknown', 'automation').catch(() => {});
      }
    } catch {
      // Mark run as failed on exception
      await supabase
        .from('ai_automation_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: 'Gateway unavailable',
        })
        .eq('id', run.id);
    }
  })();

  return success({ run });
}
