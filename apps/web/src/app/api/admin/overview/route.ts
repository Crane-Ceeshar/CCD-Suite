import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  // Use service role client for platform-wide stats (bypasses RLS)
  const serviceClient = createAdminServiceClient();

  // Run all queries in parallel — platform-wide, not tenant-scoped
  const [usersResult, activeUsersResult, tenantsResult, activityResult] = await Promise.all([
    // Total users platform-wide
    serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true }),

    // Active users platform-wide
    serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),

    // Total tenants
    serviceClient
      .from('tenants')
      .select('id', { count: 'exact', head: true }),

    // Activity logs in last 24 hours (platform-wide)
    serviceClient
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      total_users: usersResult.count ?? 0,
      active_users: activeUsersResult.count ?? 0,
      total_tenants: tenantsResult.count ?? 0,
      total_modules_enabled: tenantsResult.count ?? 0,
      recent_activity_count: activityResult.count ?? 0,
    },
  });
}
