import { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_MONTHLY_BUDGET = 1_000_000;

const DEFAULT_FEATURES_ENABLED = {
  chat: true,
  content_generation: true,
  insights: true,
  automations: false,
};

interface AiSettings {
  id: string;
  tenant_id: string;
  preferred_model: string;
  max_tokens_per_request: number;
  monthly_token_budget: number;
  monthly_tokens_used: number;
  features_enabled: Record<string, boolean>;
  system_prompt?: string;
  available_models?: string[];
  conversation_retention_days?: number;
  insight_retention_days?: number;
  generation_retention_days?: number;
  last_token_reset_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface TokenBudgetResult {
  allowed: boolean;
  remaining: number;
  budget: number;
  used: number;
}

/**
 * Check if a tenant has tokens remaining in their monthly budget.
 *
 * Queries the `ai_settings` table for the tenant's `monthly_token_budget` and
 * `monthly_tokens_used`. If no settings row exists the tenant is allowed with
 * the default budget of 1,000,000 tokens.
 *
 * @param supabase - Authenticated Supabase client
 * @param tenantId - The tenant UUID to check
 * @returns Budget status including whether the tenant is allowed to use tokens
 */
export async function checkTokenBudget(
  supabase: SupabaseClient,
  tenantId: string
): Promise<TokenBudgetResult> {
  const { data: settings } = await supabase
    .from('ai_settings')
    .select('monthly_token_budget, monthly_tokens_used')
    .eq('tenant_id', tenantId)
    .single();

  const budget = settings?.monthly_token_budget ?? DEFAULT_MONTHLY_BUDGET;
  const used = settings?.monthly_tokens_used ?? 0;
  const remaining = Math.max(budget - used, 0);

  return {
    allowed: remaining > 0,
    remaining,
    budget,
    used,
  };
}

/**
 * Increment the tenant's `monthly_tokens_used` counter in `ai_settings`.
 *
 * If no settings row exists for the tenant, one is created with default values
 * before the update is applied.
 *
 * @param supabase - Authenticated Supabase client
 * @param tenantId - The tenant UUID to track usage for
 * @param tokensUsed - Number of tokens to add to the monthly total
 */
export async function trackTokenUsage(
  supabase: SupabaseClient,
  tenantId: string,
  tokensUsed: number,
  userId?: string,
  model?: string,
  requestType?: string
): Promise<void> {
  // Ensure a settings row exists for this tenant
  const settings = await getAiSettings(supabase, tenantId);

  const newTotal = (settings.monthly_tokens_used ?? 0) + tokensUsed;

  await supabase
    .from('ai_settings')
    .update({ monthly_tokens_used: newTotal })
    .eq('tenant_id', tenantId);

  // Track daily usage for analytics (fire-and-forget)
  if (userId) {
    try {
      await supabase.rpc('upsert_ai_usage_daily', {
        p_tenant_id: tenantId,
        p_user_id: userId,
        p_date: new Date().toISOString().split('T')[0],
        p_tokens: tokensUsed,
        p_model: model ?? 'unknown',
        p_type: requestType ?? 'chat',
      });
    } catch {
      // Silently ignore analytics tracking errors
    }
  }
}

/**
 * Get or create default AI settings for a tenant.
 *
 * If no `ai_settings` row exists for the tenant, a new one is inserted with
 * sensible defaults (Claude Sonnet model, 4096 max tokens per request,
 * 1,000,000 monthly budget, chat/content_generation/insights enabled).
 *
 * @param supabase - Authenticated Supabase client
 * @param tenantId - The tenant UUID
 * @returns The tenant's AI settings object
 */
export async function getAiSettings(
  supabase: SupabaseClient,
  tenantId: string
): Promise<AiSettings> {
  const { data: existing } = await supabase
    .from('ai_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (existing) {
    return existing as AiSettings;
  }

  // No settings row exists — create one with defaults
  const { data: created, error } = await supabase
    .from('ai_settings')
    .insert({
      tenant_id: tenantId,
      preferred_model: 'claude-sonnet-4-20250514',
      max_tokens_per_request: 4096,
      monthly_token_budget: DEFAULT_MONTHLY_BUDGET,
      monthly_tokens_used: 0,
      features_enabled: DEFAULT_FEATURES_ENABLED,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create default AI settings: ${error.message}`);
  }

  return created as AiSettings;
}

/**
 * Check if a specific AI feature is enabled for a tenant.
 *
 * Supported feature keys: `chat`, `content_generation`, `insights`, `automations`.
 *
 * @param supabase - Authenticated Supabase client
 * @param tenantId - The tenant UUID
 * @param feature  - The feature key to check (e.g. "chat", "content_generation")
 * @returns `true` if the feature is enabled, `false` otherwise
 */
export async function isFeatureEnabled(
  supabase: SupabaseClient,
  tenantId: string,
  feature: string
): Promise<boolean> {
  const settings = await getAiSettings(supabase, tenantId);
  const features = settings.features_enabled as Record<string, boolean>;

  return features[feature] === true;
}
