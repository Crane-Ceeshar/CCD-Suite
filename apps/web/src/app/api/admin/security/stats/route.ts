import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';
import { success, dbError } from '@/lib/api/responses';
import { rateLimit, RATE_LIMIT_PRESETS } from '@/lib/api/rate-limit';

export async function GET() {
  const { error: authErr, user, profile } = await requireAdmin();
  if (authErr) return authErr;

  const { limited, response } = rateLimit(user.id, RATE_LIMIT_PRESETS.admin);
  if (limited) return response!;

  const serviceClient = createAdminServiceClient();
  const now = new Date();
  const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const d7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const tenantId = profile.tenant_id;

  // Run all queries in parallel
  const [
    events24h,
    events7d,
    events30d,
    criticalEvents,
    highEvents,
    mediumEvents,
    lowEvents,
    blockedIps,
    lastScan,
    unresolvedEvents,
  ] = await Promise.all([
    // Events in last 24h
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', h24),

    // Events in last 7d
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', d7),

    // Events in last 30d
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', d30),

    // Critical events (30d)
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('severity', 'critical')
      .gte('created_at', d30),

    // High events (30d)
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('severity', 'high')
      .gte('created_at', d30),

    // Medium events (30d)
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('severity', 'medium')
      .gte('created_at', d30),

    // Low events (30d)
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('severity', 'low')
      .gte('created_at', d30),

    // Active blocked IPs count
    serviceClient
      .from('blocked_ips')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('is_active', true),

    // Last completed scan
    serviceClient
      .from('security_scan_results')
      .select('id, scan_type, score, completed_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Unresolved events
    serviceClient
      .from('security_events')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('resolved', false),
  ]);

  return success({
    events_24h: events24h.count ?? 0,
    events_7d: events7d.count ?? 0,
    events_30d: events30d.count ?? 0,
    events_by_severity: {
      critical: criticalEvents.count ?? 0,
      high: highEvents.count ?? 0,
      medium: mediumEvents.count ?? 0,
      low: lowEvents.count ?? 0,
    },
    blocked_ips_count: blockedIps.count ?? 0,
    last_scan: lastScan.data ?? null,
    unresolved_count: unresolvedEvents.count ?? 0,
  });
}
