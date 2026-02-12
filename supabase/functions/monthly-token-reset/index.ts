// Edge Function: monthly-token-reset
// Cron: 0 0 1 * * (midnight on the 1st of each month)
// Resets monthly_tokens_used to 0 for all tenants and archives final totals.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get all tenants that have AI settings
    const { data: allSettings, error: fetchErr } = await supabase
      .from('ai_settings')
      .select('id, tenant_id, monthly_tokens_used, monthly_token_budget');

    if (fetchErr) {
      console.error('Failed to fetch AI settings:', fetchErr.message);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!allSettings || allSettings.length === 0) {
      return new Response(JSON.stringify({ message: 'No tenants with AI settings', count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    let resetCount = 0;
    const errors: string[] = [];

    for (const settings of allSettings) {
      try {
        // Archive final month total to activity_logs for audit trail
        if (settings.monthly_tokens_used > 0) {
          await supabase.from('activity_logs').insert({
            tenant_id: settings.tenant_id,
            user_id: '00000000-0000-0000-0000-000000000000', // system
            action: 'ai.monthly_reset',
            resource_type: 'ai_settings',
            details: {
              month: lastMonthStr,
              tokens_used: settings.monthly_tokens_used,
              token_budget: settings.monthly_token_budget,
              utilization_percent: Math.round(
                (settings.monthly_tokens_used / settings.monthly_token_budget) * 100
              ),
            },
          });
        }

        // Reset the counter
        const { error: updateErr } = await supabase
          .from('ai_settings')
          .update({
            monthly_tokens_used: 0,
            last_token_reset_at: now.toISOString(),
          })
          .eq('id', settings.id);

        if (updateErr) {
          errors.push(`Tenant ${settings.tenant_id}: ${updateErr.message}`);
        } else {
          resetCount++;
        }
      } catch (err) {
        errors.push(
          `Tenant ${settings.tenant_id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: `Reset ${resetCount} of ${allSettings.length} tenant(s)`,
        count: resetCount,
        total: allSettings.length,
        month_archived: lastMonthStr,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('monthly-token-reset error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
