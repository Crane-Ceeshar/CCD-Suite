// Edge Function: data-retention-cleanup
// Cron: 0 2 * * * (2 AM daily)
// Deletes old AI data based on per-tenant retention settings.
// Conversations, insights, and generation jobs older than retention thresholds are purged.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface RetentionSettings {
  id: string;
  tenant_id: string;
  conversation_retention_days: number;
  insight_retention_days: number;
  generation_retention_days: number;
}

interface CleanupResult {
  tenant_id: string;
  conversations_deleted: number;
  insights_deleted: number;
  generation_jobs_deleted: number;
}

/**
 * Calculate the cutoff date from a retention period in days.
 * Returns null if retention is 0 (keep forever).
 */
function getCutoffDate(retentionDays: number): string | null {
  if (retentionDays <= 0) return null;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - retentionDays);
  return cutoff.toISOString();
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Get all tenants with retention settings
    const { data: allSettings, error: fetchErr } = await supabase
      .from('ai_settings')
      .select('id, tenant_id, conversation_retention_days, insight_retention_days, generation_retention_days');

    if (fetchErr) {
      console.error('Failed to fetch retention settings:', fetchErr.message);
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

    const results: CleanupResult[] = [];
    const errors: string[] = [];

    for (const settings of allSettings as RetentionSettings[]) {
      const result: CleanupResult = {
        tenant_id: settings.tenant_id,
        conversations_deleted: 0,
        insights_deleted: 0,
        generation_jobs_deleted: 0,
      };

      try {
        // Delete old conversations (cascades to messages)
        const convCutoff = getCutoffDate(settings.conversation_retention_days);
        if (convCutoff) {
          const { data: deletedConvs, error: convErr } = await supabase
            .from('ai_conversations')
            .delete()
            .eq('tenant_id', settings.tenant_id)
            .lt('updated_at', convCutoff)
            .select('id');

          if (convErr) {
            errors.push(`Tenant ${settings.tenant_id} conversations: ${convErr.message}`);
          } else {
            result.conversations_deleted = deletedConvs?.length ?? 0;
          }
        }

        // Delete old insights
        const insightCutoff = getCutoffDate(settings.insight_retention_days);
        if (insightCutoff) {
          const { data: deletedInsights, error: insightErr } = await supabase
            .from('ai_insights')
            .delete()
            .eq('tenant_id', settings.tenant_id)
            .lt('created_at', insightCutoff)
            .select('id');

          if (insightErr) {
            errors.push(`Tenant ${settings.tenant_id} insights: ${insightErr.message}`);
          } else {
            result.insights_deleted = deletedInsights?.length ?? 0;
          }
        }

        // Delete old generation jobs
        const genCutoff = getCutoffDate(settings.generation_retention_days);
        if (genCutoff) {
          const { data: deletedJobs, error: genErr } = await supabase
            .from('ai_generation_jobs')
            .delete()
            .eq('tenant_id', settings.tenant_id)
            .lt('created_at', genCutoff)
            .select('id');

          if (genErr) {
            errors.push(`Tenant ${settings.tenant_id} generation jobs: ${genErr.message}`);
          } else {
            result.generation_jobs_deleted = deletedJobs?.length ?? 0;
          }
        }

        // Log cleanup activity if anything was deleted
        const totalDeleted =
          result.conversations_deleted + result.insights_deleted + result.generation_jobs_deleted;
        if (totalDeleted > 0) {
          await supabase.from('activity_logs').insert({
            tenant_id: settings.tenant_id,
            user_id: '00000000-0000-0000-0000-000000000000', // system
            action: 'ai.data_retention_cleanup',
            resource_type: 'ai_settings',
            details: {
              conversations_deleted: result.conversations_deleted,
              insights_deleted: result.insights_deleted,
              generation_jobs_deleted: result.generation_jobs_deleted,
              retention_config: {
                conversation_days: settings.conversation_retention_days,
                insight_days: settings.insight_retention_days,
                generation_days: settings.generation_retention_days,
              },
            },
          });
        }

        results.push(result);
      } catch (err) {
        errors.push(
          `Tenant ${settings.tenant_id}: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    }

    const totalConv = results.reduce((sum, r) => sum + r.conversations_deleted, 0);
    const totalInsights = results.reduce((sum, r) => sum + r.insights_deleted, 0);
    const totalGen = results.reduce((sum, r) => sum + r.generation_jobs_deleted, 0);

    return new Response(
      JSON.stringify({
        message: `Cleanup complete across ${results.length} tenant(s)`,
        summary: {
          tenants_processed: results.length,
          conversations_deleted: totalConv,
          insights_deleted: totalInsights,
          generation_jobs_deleted: totalGen,
        },
        details: results.filter(
          (r) =>
            r.conversations_deleted > 0 || r.insights_deleted > 0 || r.generation_jobs_deleted > 0
        ),
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('data-retention-cleanup error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
