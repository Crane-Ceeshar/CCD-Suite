import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { sendLeaveFormSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'hr:leave:send-form' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, sendLeaveFormSchema);
  if (bodyError) return bodyError;

  // Fetch employee
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email')
    .eq('id', body.employee_id)
    .single();

  if (empError || !employee) {
    return dbError(empError!, 'Employee not found');
  }

  if (!employee.email) {
    return NextResponse.json(
      { success: false, error: { message: 'Employee has no email address' } },
      { status: 400 }
    );
  }

  // Generate token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: tokenError } = await supabase
    .from('hr_form_tokens')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: body.employee_id,
      token_hash: tokenHash,
      token_type: 'leave_request',
      expires_at: expiresAt,
    });

  if (tokenError) {
    return NextResponse.json(
      { success: false, error: { message: tokenError.message } },
      { status: 500 }
    );
  }

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ccdsuite.com';
  const formUrl = `${baseUrl}/hr/leave-request/${token}`;

  try {
    await sendEmail({
      to: employee.email,
      subject: 'Leave Request Form',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${employee.first_name},</h2>
          <p>Please submit your leave request using the link below:</p>
          ${body.message ? `<p>${body.message}</p>` : ''}
          <p style="margin: 24px 0;">
            <a href="${formUrl}"
               style="background-color: #0047AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Submit Leave Request
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
        </div>
      `,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Failed to send email' } },
      { status: 500 }
    );
  }

  logAudit(supabase, profile.tenant_id, user.id, {
    action: 'leave_form.sent',
    resource_type: 'leave_request',
    resource_id: body.employee_id,
    details: { employee_email: employee.email },
  });

  return success({ sent: true, employee_id: body.employee_id });
}
