import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';
import { validateBody } from '@/lib/api/validate';
import { sendContractSchema } from '@/lib/api/schemas/hr';
import { rateLimit } from '@/lib/api/rate-limit';
import { logAudit } from '@/lib/api/audit';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const { limited, response: limitResp } = rateLimit(user.id, { max: 20, keyPrefix: 'hr:contracts:send' });
  if (limited) return limitResp!;

  const { data: body, error: bodyError } = await validateBody(request, sendContractSchema);
  if (bodyError) return bodyError;

  // Fetch the contract with employee
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, employee:employees!employee_id(id, first_name, last_name, email)')
    .eq('id', id)
    .single();

  if (contractError || !contract) {
    return dbError(contractError!, 'Contract not found');
  }

  if (!contract.employee?.email) {
    return NextResponse.json(
      { success: false, error: { message: 'Employee has no email address' } },
      { status: 400 }
    );
  }

  // Generate magic link token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Store token
  const { error: tokenError } = await supabase
    .from('hr_form_tokens')
    .insert({
      tenant_id: profile.tenant_id,
      employee_id: contract.employee_id,
      token_hash: tokenHash,
      token_type: 'contract_signing',
      expires_at: expiresAt,
      metadata: { contract_id: id },
    });

  if (tokenError) {
    return NextResponse.json(
      { success: false, error: { message: tokenError.message } },
      { status: 500 }
    );
  }

  // Update contract status
  await supabase
    .from('contracts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id);

  // Send email
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ccdsuite.com';
  const signUrl = `${baseUrl}/hr/sign/${token}`;

  try {
    await sendEmail({
      to: contract.employee.email,
      subject: `Contract: ${contract.title} — Please Review and Sign`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${contract.employee.first_name},</h2>
          <p>You have a new contract to review and sign: <strong>${contract.title}</strong></p>
          ${body.message ? `<p>${body.message}</p>` : ''}
          <p style="margin: 24px 0;">
            <a href="${signUrl}"
               style="background-color: #0047AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Review &amp; Sign Contract
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
    action: 'contract.sent',
    resource_type: 'contract',
    resource_id: id,
    details: { employee_email: contract.employee.email },
  });

  return success({ sent: true, contract_id: id });
}
