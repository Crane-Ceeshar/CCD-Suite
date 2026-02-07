import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors when API key is not set
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailOptions) {
  const resend = getResend();
  const fromAddress = from || process.env.EMAIL_FROM || 'CCD Suite <noreply@ccdsuite.com>';

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    throw new Error(`Email failed: ${error.message}`);
  }

  return data;
}
