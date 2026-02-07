import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const tenantId = profile.tenant_id;

  // Run all queries in parallel
  const [usersResult, activeUsersResult, tenantResult, activityResult] = await Promise.all([
    // Total users in tenant
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId),

    // Active users in tenant
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),

    // Tenant settings (for modules_enabled count)
    supabase
      .from('tenants')
      .select('settings')
      .eq('id', tenantId)
      .single(),

    // Activity logs in last 24 hours
    supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const settings = tenantResult.data?.settings as { modules_enabled?: string[] } | null;
  const modulesEnabled = settings?.modules_enabled ?? [];

  return NextResponse.json({
    success: true,
    data: {
      total_users: usersResult.count ?? 0,
      active_users: activeUsersResult.count ?? 0,
      total_modules_enabled: modulesEnabled.length,
      recent_activity_count: activityResult.count ?? 0,
    },
  });
}
