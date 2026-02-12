import { SupabaseClient } from '@supabase/supabase-js';

// ── Types ───────────────────────────────────────────────────

type SecurityEventType =
  | 'failed_login'
  | 'brute_force'
  | 'suspicious_request'
  | 'token_abuse'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'xss_attempt'
  | 'sql_injection_attempt';

type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

interface SecurityEventInput {
  type: SecurityEventType;
  severity: SecuritySeverity;
  tenantId?: string;
  sourceIp?: string;
  userId?: string;
  userAgent?: string;
  endpoint?: string;
  details?: Record<string, unknown>;
}

// ── Brute-force detection constants ─────────────────────────

/** Number of failed logins within the window that triggers a block */
const BRUTE_FORCE_THRESHOLD = 5;

/** Lookback window in minutes for failed login attempts */
const BRUTE_FORCE_WINDOW_MINUTES = 5;

/** How long an auto-block lasts in hours */
const AUTO_BLOCK_DURATION_HOURS = 1;

// ── Functions ───────────────────────────────────────────────

/**
 * Log a security event to the security_events table.
 * Fire-and-forget — never throws.
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  event: SecurityEventInput
): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      tenant_id: event.tenantId || null,
      event_type: event.type,
      severity: event.severity,
      source_ip: event.sourceIp || null,
      user_id: event.userId || null,
      user_agent: event.userAgent || null,
      endpoint: event.endpoint || null,
      details: event.details || {},
    });
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

/**
 * Detect brute-force login attempts from a given IP address.
 *
 * Queries security_events for `failed_login` events from the IP
 * within the last 5 minutes. If the count meets or exceeds the
 * threshold, logs a `brute_force` event with `critical` severity
 * and auto-blocks the IP for 1 hour.
 *
 * Fire-and-forget — never throws.
 */
export async function detectBruteForce(
  supabase: SupabaseClient,
  ipAddress: string,
  tenantId?: string
): Promise<void> {
  try {
    const windowStart = new Date(
      Date.now() - BRUTE_FORCE_WINDOW_MINUTES * 60 * 1000
    ).toISOString();

    const { count, error: countError } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'failed_login')
      .eq('source_ip', ipAddress)
      .gte('created_at', windowStart);

    if (countError) {
      console.error('Failed to query failed_login events:', countError);
      return;
    }

    if (count === null || count < BRUTE_FORCE_THRESHOLD) {
      return;
    }

    // Log the brute-force detection event
    await logSecurityEvent(supabase, {
      type: 'brute_force',
      severity: 'critical',
      tenantId,
      sourceIp: ipAddress,
      details: {
        failed_attempts: count,
        window_minutes: BRUTE_FORCE_WINDOW_MINUTES,
        auto_blocked: true,
      },
    });

    // Auto-block the IP for the configured duration
    const expiresAt = new Date(
      Date.now() + AUTO_BLOCK_DURATION_HOURS * 60 * 60 * 1000
    ).toISOString();

    await supabase.from('blocked_ips').insert({
      tenant_id: tenantId || null,
      ip_address: ipAddress,
      reason: `Auto-blocked: ${count} failed login attempts in ${BRUTE_FORCE_WINDOW_MINUTES} minutes`,
      expires_at: expiresAt,
      is_active: true,
    });
  } catch (err) {
    console.error('Failed to detect/block brute force:', err);
  }
}

/**
 * Check whether an IP address is currently blocked.
 *
 * Looks for active blocks that have not expired
 * (is_active = true AND (expires_at IS NULL OR expires_at > now)).
 *
 * Returns `true` if the IP is blocked, `false` otherwise.
 * On error, returns `false` to avoid blocking legitimate traffic.
 */
export async function isIpBlocked(
  supabase: SupabaseClient,
  ipAddress: string
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('blocked_ips')
      .select('id')
      .eq('ip_address', ipAddress)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .limit(1);

    if (error) {
      console.error('Failed to check blocked IP:', error);
      return false;
    }

    return data !== null && data.length > 0;
  } catch (err) {
    console.error('Failed to check blocked IP:', err);
    return false;
  }
}
