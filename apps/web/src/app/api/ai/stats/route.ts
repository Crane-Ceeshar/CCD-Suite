import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { redisRateLimit } from '@/lib/api/redis-rate-limit';
import { RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET() {
  const { error: authErr, supabase, user, profile } = await requireAuth();
  if (authErr) return authErr;

  const { limited, response } = await redisRateLimit(user.id, RATE_LIMIT_PRESETS.api);
  if (limited) return response!;

  const tenantId = profile.tenant_id;

  // Run all queries in parallel
  const [
    conversationsCount,
    generationJobsCount,
    insightsCount,
    unreadInsightsCount,
    automationsCount,
    recentConversations,
    recentJobs,
    tokenSettings,
  ] = await Promise.all([
    // Total conversations for this user
    supabase
      .from('ai_conversations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active'),

    // Total generation jobs for this user
    supabase
      .from('ai_generation_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id),

    // Total insights for tenant
    supabase
      .from('ai_insights')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),

    // Unread insights
    supabase
      .from('ai_insights')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_read', false),

    // Enabled automations
    supabase
      .from('ai_automations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_enabled', true),

    // Recent conversations
    supabase
      .from('ai_conversations')
      .select('id, title, module_context, updated_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(5),

    // Recent generation jobs
    supabase
      .from('ai_generation_jobs')
      .select('id, type, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),

    // Token usage settings
    supabase
      .from('ai_settings')
      .select('monthly_token_budget, monthly_tokens_used, features_enabled')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
  ]);

  return success({
    conversations: conversationsCount.count ?? 0,
    content_generated: generationJobsCount.count ?? 0,
    insights: insightsCount.count ?? 0,
    unread_insights: unreadInsightsCount.count ?? 0,
    automations_active: automationsCount.count ?? 0,
    recent_conversations: recentConversations.data ?? [],
    recent_jobs: recentJobs.data ?? [],
    token_usage: {
      budget: tokenSettings.data?.monthly_token_budget ?? 1000000,
      used: tokenSettings.data?.monthly_tokens_used ?? 0,
    },
    features_enabled: tokenSettings.data?.features_enabled ?? {
      chat: true,
      content_generation: true,
      insights: true,
      automations: false,
    },
  });
}
