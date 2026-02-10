import { SupabaseClient } from "@supabase/supabase-js";

interface AuditEntry {
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Log an entry to the activity_logs table.
 * Fire-and-forget — never throws.
 */
export async function logAudit(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  entry: AuditEntry
) {
  try {
    await supabase.from('activity_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id ?? null,
      details: entry.details ?? {},
      ip_address: entry.ip_address ?? null,
    });
  } catch (err) {
    console.error('Failed to log audit entry:', err);
  }
}
