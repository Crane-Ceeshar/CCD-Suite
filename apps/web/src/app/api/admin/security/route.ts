import { NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const loginActions = ['user.login', 'user.logout', 'user.login_failed'];

  const [logins24h, logins7d, logins30d, recentLogins] = await Promise.all([
    serviceClient
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .in('action', loginActions)
      .gte('created_at', h24),

    serviceClient
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .in('action', loginActions)
      .gte('created_at', d7),

    serviceClient
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .in('action', loginActions)
      .gte('created_at', d30),

    // Get recent logins to calculate unique IPs and suspicious activity
    serviceClient
      .from('activity_logs')
      .select('user_id, ip_address, created_at')
      .in('action', ['user.login', 'user.login_failed'])
      .gte('created_at', h24),
  ]);

  // Calculate unique IPs from recent logins
  const uniqueIps = new Set(
    (recentLogins.data ?? [])
      .map((l) => l.ip_address)
      .filter(Boolean)
  );

  // Simple suspicious activity heuristic: users with 5+ logins in 24h
  const loginsByUser: Record<string, number> = {};
  for (const log of recentLogins.data ?? []) {
    if (log.user_id) {
      loginsByUser[log.user_id] = (loginsByUser[log.user_id] || 0) + 1;
    }
  }
  const suspiciousCount = Object.values(loginsByUser).filter((c) => c >= 5).length;

  return NextResponse.json({
    success: true,
    data: {
      logins_24h: logins24h.count ?? 0,
      logins_7d: logins7d.count ?? 0,
      logins_30d: logins30d.count ?? 0,
      unique_ips_24h: uniqueIps.size,
      suspicious_count: suspiciousCount,
    },
  });
}
