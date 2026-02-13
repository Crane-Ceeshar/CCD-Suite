// Edge Function: run-automations
// Cron: */15 * * * * (every 15 minutes)
// Queries enabled automations whose next_run_at has passed, executes them via
// the AI gateway, records the run in ai_automation_runs, and calculates the
// next scheduled execution time.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GATEWAY_URL = Deno.env.get('API_GATEWAY_URL') || 'http://localhost:4000';

interface Automation {
  id: string;
  tenant_id: string;
  type: string;
  config: Record<string, unknown>;
  schedule_type: string;
  schedule_config: Record<string, unknown>;
  next_run_at: string;
}

/**
 * Calculate the next run time based on schedule type and config.
 */
function calculateNextRun(
  scheduleType: string,
  scheduleConfig: Record<string, unknown>,
  fromDate: Date = new Date()
): string | null {
  const time = (scheduleConfig.time as string) ?? '09:00';
  const [hours, minutes] = time.split(':').map(Number);

  switch (scheduleType) {
    case 'daily': {
      const next = new Date(fromDate);
      next.setDate(next.getDate() + 1);
      next.setHours(hours, minutes, 0, 0);
      return next.toISOString();
    }
    case 'weekly': {
      const dayOfWeek = (scheduleConfig.day_of_week as number) ?? 1; // Monday default
      const next = new Date(fromDate);
      const currentDay = next.getDay();
      let daysUntilNext = dayOfWeek - currentDay;
      if (daysUntilNext <= 0) daysUntilNext += 7;
      next.setDate(next.getDate() + daysUntilNext);
      next.setHours(hours, minutes, 0, 0);
      return next.toISOString();
    }
    case 'monthly': {
      const dayOfMonth = (scheduleConfig.day_of_month as number) ?? 1;
      const next = new Date(fromDate);
      next.setMonth(next.getMonth() + 1);
      // Clamp to last day of month if needed
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(dayOfMonth, lastDay));
      next.setHours(hours, minutes, 0, 0);
      return next.toISOString();
    }
    default:
      return null;
  }
}

/**
 * Execute a single automation: create run record, call gateway, update status.
 */
async function executeAutomation(
  supabase: ReturnType<typeof createClient>,
  automation: Automation
): Promise<void> {
  // Create a run record
  const { data: run, error: runErr } = await supabase
    .from('ai_automation_runs')
    .insert({
      automation_id: automation.id,
      tenant_id: automation.tenant_id,
      status: 'running',
    })
    .select('id')
    .single();

  if (runErr || !run) {
    console.error(`Failed to create run for automation ${automation.id}:`, runErr?.message);
    return;
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/api/ai/automation/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        automation_type: automation.type,
        automation_config: automation.config,
        tenant_id: automation.tenant_id,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error');
      await supabase
        .from('ai_automation_runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: `Gateway error ${res.status}: ${errText.slice(0, 500)}`,
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

    // Track token usage in ai_settings
    if (tokensUsed > 0) {
      const { data: settings } = await supabase
        .from('ai_settings')
        .select('monthly_tokens_used')
        .eq('tenant_id', automation.tenant_id)
        .single();

      if (settings) {
        await supabase
          .from('ai_settings')
          .update({
            monthly_tokens_used: (settings.monthly_tokens_used ?? 0) + tokensUsed,
          })
          .eq('tenant_id', automation.tenant_id);
      }

      // Track daily analytics
      await supabase
        .rpc('upsert_ai_usage_daily', {
          p_tenant_id: automation.tenant_id,
          p_user_id: '00000000-0000-0000-0000-000000000000', // system user for scheduled runs
          p_date: new Date().toISOString().split('T')[0],
          p_tokens: tokensUsed,
          p_model: data.model ?? 'unknown',
          p_type: 'automation',
        })
        .catch(() => {});
    }
  } catch (err) {
    await supabase
      .from('ai_automation_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : 'Gateway unavailable',
      })
      .eq('id', run.id);
  }

  // Update last_run_at and calculate next_run_at
  const nextRunAt = calculateNextRun(automation.schedule_type, automation.schedule_config as Record<string, unknown>);
  await supabase
    .from('ai_automations')
    .update({
      last_run_at: new Date().toISOString(),
      ...(nextRunAt ? { next_run_at: nextRunAt } : {}),
    })
    .eq('id', automation.id);
}

Deno.serve(async (req) => {
  try {
    // Verify the request (cron invocations include an Authorization header)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Find all enabled automations that are due to run
    const { data: automations, error: queryErr } = await supabase
      .from('ai_automations')
      .select('id, tenant_id, type, config, schedule_type, schedule_config, next_run_at')
      .eq('is_enabled', true)
      .neq('schedule_type', 'manual')
      .lte('next_run_at', new Date().toISOString());

    if (queryErr) {
      console.error('Failed to query automations:', queryErr.message);
      return new Response(JSON.stringify({ error: queryErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!automations || automations.length === 0) {
      return new Response(JSON.stringify({ message: 'No automations due', count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${automations.length} automation(s) due for execution`);

    // Execute automations concurrently (with a limit to avoid overwhelming gateway)
    const CONCURRENCY_LIMIT = 5;
    const results: { id: string; status: string }[] = [];

    for (let i = 0; i < automations.length; i += CONCURRENCY_LIMIT) {
      const batch = automations.slice(i, i + CONCURRENCY_LIMIT);
      await Promise.allSettled(
        batch.map(async (automation) => {
          try {
            await executeAutomation(supabase, automation as Automation);
            results.push({ id: automation.id, status: 'executed' });
          } catch {
            results.push({ id: automation.id, status: 'error' });
          }
        })
      );
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} automation(s)`,
        count: results.length,
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('run-automations error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
