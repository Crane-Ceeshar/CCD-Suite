import { NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, error as errorResp, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { logAudit } from '@/lib/api/audit';
import { reportScheduleSchema } from '@/lib/api/schemas/analytics-advanced';
import { sendEmail } from '@/lib/email';

const scheduleWithReportSchema = reportScheduleSchema.extend({
  report_id: z.string().uuid(),
});

/**
 * POST /api/analytics/reports/schedule
 * Save or update a report schedule. Sends a confirmation email to the first recipient.
 */
export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { data: body, error: bodyError } = await validateBody(request, scheduleWithReportSchema);
  if (bodyError) return bodyError;

  // Verify the report exists and belongs to the tenant
  const { data: report, error: fetchError } = await supabase
    .from('analytics_reports')
    .select('id, name, tenant_id')
    .eq('id', body.report_id)
    .single();

  if (fetchError) {
    return dbError(fetchError, 'Report');
  }

  if (!report) {
    return errorResp('Report not found', 404);
  }

  // Build the schedule config
  const scheduleConfig = {
    frequency: body.frequency,
    recipients: body.recipients,
    day_of_week: body.day_of_week ?? null,
    time: body.time ?? '09:00',
    format: body.format,
    enabled: body.enabled,
    updated_at: new Date().toISOString(),
  };

  // Update the report with the schedule
  const { data: updated, error: updateError } = await supabase
    .from('analytics_reports')
    .update({ schedule: scheduleConfig })
    .eq('id', body.report_id)
    .select()
    .single();

  if (updateError) {
    return dbError(updateError, 'Failed to update report schedule');
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'report.schedule_updated',
    resource_type: 'analytics_report',
    resource_id: body.report_id,
    details: { frequency: body.frequency, recipients_count: body.recipients.length },
  });

  // Fire-and-forget: send confirmation email to first recipient
  if (body.enabled && body.recipients.length > 0) {
    sendEmail({
      to: body.recipients[0],
      subject: `Report scheduled: ${report.name}`,
      html: `
        <h2>Report Schedule Confirmed</h2>
        <p>The report <strong>${report.name}</strong> has been scheduled.</p>
        <ul>
          <li><strong>Frequency:</strong> ${body.frequency}</li>
          <li><strong>Format:</strong> ${body.format}</li>
          <li><strong>Recipients:</strong> ${body.recipients.join(', ')}</li>
        </ul>
        <p>You will receive the report at the scheduled time.</p>
      `,
    }).catch((err) => console.error('Failed to send schedule confirmation email:', err));
  }

  return success(updated);
}
