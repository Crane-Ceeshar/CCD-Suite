import { SupabaseClient } from '@supabase/supabase-js';

interface FeatureFlag {
  id: string;
  key: string;
  is_enabled: boolean;
}

interface FlagOverride {
  flag_id: string;
  is_enabled: boolean;
}

/**
 * Check if a specific feature flag is enabled for a tenant.
 *
 * Checks for a tenant-specific override first, then falls back to the global
 * default. Returns `false` if the flag does not exist.
 *
 * @param supabase  - Authenticated Supabase client
 * @param tenantId  - The tenant UUID
 * @param flagKey   - The flag key to check (e.g. "ai_chat_widget")
 * @returns `true` if the flag is enabled for this tenant, `false` otherwise
 */
export async function isFeatureFlagEnabled(
  supabase: SupabaseClient,
  tenantId: string,
  flagKey: string
): Promise<boolean> {
  const { data: flag } = await supabase
    .from('feature_flags')
    .select('id, is_enabled')
    .eq('key', flagKey)
    .single();

  if (!flag) return false;

  // Check for tenant override
  const { data: override } = await supabase
    .from('feature_flag_overrides')
    .select('is_enabled')
    .eq('flag_id', flag.id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (override) return override.is_enabled;
  return flag.is_enabled;
}

/**
 * Get all feature flags resolved for a tenant.
 *
 * For each flag, checks whether a tenant-specific override exists and
 * returns the override value if present, otherwise the global default.
 *
 * @param supabase  - Authenticated Supabase client
 * @param tenantId  - The tenant UUID
 * @returns A Record mapping flag keys to their effective boolean values
 */
export async function getFeatureFlags(
  supabase: SupabaseClient,
  tenantId: string
): Promise<Record<string, boolean>> {
  const { data: flags } = await supabase
    .from('feature_flags')
    .select('id, key, is_enabled');

  if (!flags || flags.length === 0) return {};

  const flagIds = flags.map((f: FeatureFlag) => f.id);

  const { data: overrides } = await supabase
    .from('feature_flag_overrides')
    .select('flag_id, is_enabled')
    .eq('tenant_id', tenantId)
    .in('flag_id', flagIds);

  const overrideMap = new Map<string, boolean>(
    (overrides ?? []).map((o: FlagOverride) => [o.flag_id, o.is_enabled])
  );

  const result: Record<string, boolean> = {};
  for (const flag of flags as FeatureFlag[]) {
    result[flag.key] = overrideMap.has(flag.id)
      ? overrideMap.get(flag.id)!
      : flag.is_enabled;
  }
  return result;
}
