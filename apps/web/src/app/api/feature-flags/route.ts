import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { getFeatureFlags } from '@/lib/api/feature-flags';

/**
 * GET /api/feature-flags
 *
 * Returns all feature flags resolved for the current user's tenant.
 * Each flag reflects the tenant-specific override if one exists,
 * otherwise the global default.
 */
export async function GET() {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const flags = await getFeatureFlags(supabase, profile.tenant_id);

  return NextResponse.json({ success: true, data: flags });
}
