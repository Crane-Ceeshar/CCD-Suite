import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit } from '@/lib/api/rate-limit';

/**
 * GET /api/settings/usage
 * Tenant usage statistics — counts of key resources scoped to the current tenant.
 */
export async function GET(_request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 30, keyPrefix: 'settings:usage' });
  if (limited) return limitResp!;

  // Run all count queries in parallel
  const [
    { count: contentItems, error: e1 },
    { count: deals, error: e2 },
    { count: contentAssets, error: e3 },
    { count: teamMembers, error: e4 },
    { count: metrics, error: e5 },
    { count: integrations, error: e6 },
  ] = await Promise.all([
    supabase
      .from('content_items')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id),
    supabase
      .from('deals')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id),
    supabase
      .from('content_assets')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id),
    supabase
      .from('metrics')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id),
    supabase
      .from('publishing_integrations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id),
  ]);

  // If any query failed, return the first error
  const firstError = e1 || e2 || e3 || e4 || e5 || e6;
  if (firstError) return dbError(firstError, 'Failed to fetch usage statistics');

  return success({
    content_items: contentItems ?? 0,
    deals: deals ?? 0,
    content_assets: contentAssets ?? 0,
    team_members: teamMembers ?? 0,
    metrics: metrics ?? 0,
    integrations: integrations ?? 0,
  });
}
