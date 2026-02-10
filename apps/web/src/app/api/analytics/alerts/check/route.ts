import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error } from '@/lib/api/responses';
import { sendEmail } from '@/lib/email';
import { createNotification } from '@/lib/api/activity';

interface AlertRow {
  id: string;
  tenant_id: string;
  name: string;
  metric_key: string;
  condition: 'above' | 'below' | 'equals' | 'change_pct';
  threshold: number;
  channel: 'email' | 'in_app' | 'both';
  recipients: string[];
  last_value: number | null;
  created_by: string;
}

/**
 * POST /api/analytics/alerts/check
 * Check all active alerts for the tenant and trigger notifications for met conditions.
 */
export async function POST(_request: NextRequest) {
  const { error: authError, supabase, user, profile } = await requireAuth();
  if (authError) return authError;

  try {
    // Fetch all active alerts for the tenant
    const { data: alerts, error: alertsError } = await supabase
      .from('analytics_alerts')
      .select('*')
      .eq('is_active', true);

    if (alertsError) {
      return error('Failed to fetch alerts', 500);
    }

    if (!alerts || alerts.length === 0) {
      return success({ triggered: [], total_checked: 0 });
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceISO = since.toISOString();

    // Pre-fetch metric data in parallel for efficiency
    const [dealsResult, engagementResult, contentResult, seoResult] = await Promise.all([
      supabase
        .from('deals')
        .select('value, status, actual_close_date')
        .eq('status', 'won')
        .gte('actual_close_date', sinceISO),
      supabase
        .from('social_engagement')
        .select('likes, comments, shares, impressions')
        .gte('recorded_at', sinceISO),
      supabase
        .from('content_items')
        .select('id')
        .gte('created_at', sinceISO),
      supabase
        .from('seo_audits')
        .select('score')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1),
    ]);

    const deals = dealsResult.data ?? [];
    const engagement = engagementResult.data ?? [];
    const contentItems = contentResult.data ?? [];
    const seoAudits = seoResult.data ?? [];

    // Compute metric values
    const metricValues: Record<string, number> = {
      revenue: deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
      deals_won: deals.length,
      pipeline_value: 0, // would need open deals query
      engagement: engagement.reduce(
        (sum, e) => sum + (e.likes ?? 0) + (e.comments ?? 0) + (e.shares ?? 0),
        0
      ),
      impressions: engagement.reduce((sum, e) => sum + (e.impressions ?? 0), 0),
      content_count: contentItems.length,
      audit_score: seoAudits.length > 0 ? seoAudits[0].score : 0,
      tracked_keywords: 0,
    };

    const triggered: { alert_id: string; name: string; metric_key: string; value: number; threshold: number }[] = [];

    for (const alert of alerts as AlertRow[]) {
      const currentValue = metricValues[alert.metric_key] ?? 0;

      // Evaluate condition
      let conditionMet = false;
      switch (alert.condition) {
        case 'above':
          conditionMet = currentValue > alert.threshold;
          break;
        case 'below':
          conditionMet = currentValue < alert.threshold;
          break;
        case 'equals':
          conditionMet = currentValue === alert.threshold;
          break;
        case 'change_pct': {
          const lastVal = alert.last_value ?? 0;
          if (lastVal !== 0) {
            const pctChange = Math.abs(((currentValue - lastVal) / lastVal) * 100);
            conditionMet = pctChange >= alert.threshold;
          }
          break;
        }
      }

      if (!conditionMet) continue;

      // Update last_triggered_at and last_value
      await supabase
        .from('analytics_alerts')
        .update({
          last_triggered_at: new Date().toISOString(),
          last_value: currentValue,
        })
        .eq('id', alert.id);

      triggered.push({
        alert_id: alert.id,
        name: alert.name,
        metric_key: alert.metric_key,
        value: currentValue,
        threshold: alert.threshold,
      });

      // Send notifications based on channel
      const shouldEmail = alert.channel === 'email' || alert.channel === 'both';
      const shouldInApp = alert.channel === 'in_app' || alert.channel === 'both';

      if (shouldEmail && alert.recipients.length > 0) {
        for (const recipient of alert.recipients) {
          sendEmail({
            to: recipient,
            subject: `Alert triggered: ${alert.name}`,
            html: `
              <h2>Analytics Alert: ${alert.name}</h2>
              <p>The metric <strong>${alert.metric_key}</strong> has met the condition <strong>${alert.condition} ${alert.threshold}</strong>.</p>
              <p>Current value: <strong>${currentValue}</strong></p>
              <p>This alert was triggered at ${new Date().toISOString()}.</p>
            `,
          }).catch((err) => console.error('Failed to send alert email:', err));
        }
      }

      if (shouldInApp) {
        createNotification(supabase, profile.tenant_id, {
          user_id: alert.created_by,
          type: 'warning',
          title: `Alert: ${alert.name}`,
          message: `${alert.metric_key} is ${alert.condition} ${alert.threshold} (current: ${currentValue})`,
          link: '/analytics',
          module: 'analytics',
        });
      }
    }

    return success({
      triggered,
      total_checked: alerts.length,
      total_triggered: triggered.length,
    });
  } catch (err) {
    console.error('Alert check error:', err);
    return error('Failed to check alerts', 500);
  }
}
