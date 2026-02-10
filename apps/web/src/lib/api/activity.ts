import { SupabaseClient } from "@supabase/supabase-js";

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'mention' | 'assignment' | 'update' | 'reminder';

interface NotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  module?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification for a user.
 * Fire-and-forget — never throws.
 */
export async function createNotification(
  supabase: SupabaseClient,
  tenantId: string,
  input: NotificationInput
) {
  try {
    await supabase.from('notifications').insert({
      tenant_id: tenantId,
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      module: input.module ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}

/**
 * Log activity AND optionally create a notification.
 */
export async function logActivity(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  opts: {
    action: string;
    module: string;
    resource_type: string;
    resource_id?: string;
    summary: string;
    notify?: NotificationInput;
  }
) {
  try {
    await supabase.from('activity_logs').insert({
      tenant_id: tenantId,
      user_id: userId,
      action: opts.action,
      resource_type: opts.resource_type,
      resource_id: opts.resource_id ?? null,
      details: { summary: opts.summary, module: opts.module },
    });

    if (opts.notify) {
      await createNotification(supabase, tenantId, opts.notify);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}
