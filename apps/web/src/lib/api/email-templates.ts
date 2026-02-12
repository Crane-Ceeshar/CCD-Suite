import { createAdminServiceClient } from '@/lib/supabase/admin';

/**
 * Default email templates — used as fallbacks when no admin customization exists.
 * These match the current hardcoded HTML in the various email-sending routes.
 */
const DEFAULT_TEMPLATES: Record<string, { subject: string; body_html: string }> = {
  email_template_invite: {
    subject: "You've been invited to join {{tenant_name}} on CCD Suite",
    body_html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a; margin-bottom: 16px;">You've been invited!</h2>
  <p style="color: #4a4a4a; line-height: 1.6;">
    <strong>{{inviter_name}}</strong> has invited you to join
    <strong>{{tenant_name}}</strong> on CCD Suite as a <strong>{{user_type}}</strong>.
  </p>
  {{#message}}<div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;"><p style="color: #4a4a4a; margin: 0; font-style: italic;">"{{message}}"</p></div>{{/message}}
  <p style="color: #4a4a4a; line-height: 1.6;">
    A temporary password has been created for your account. Please log in and change your password immediately.
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{action_url}}" style="background: #0047AB; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
      Open Dashboard
    </a>
  </div>
  <p style="color: #888; font-size: 13px;">
    Your login email: <strong>{{email}}</strong><br/>
    Your temporary password: <strong>{{temp_password}}</strong>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #aaa; font-size: 12px;">
    This invitation was sent from CCD Suite. If you didn't expect this, you can ignore this email.
  </p>
</div>`,
  },

  email_template_portal_invite: {
    subject: "You've been invited to the Client Portal",
    body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hello {{first_name}},</h2>
  <p>You've been invited to access your client portal. Click the link below to get started:</p>
  <p style="margin: 24px 0;">
    <a href="{{action_url}}"
       style="background-color: #0047AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Access Portal
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
</div>`,
  },

  email_template_invoice: {
    subject: 'Invoice {{invoice_number}} from {{tenant_name}}',
    // Pass-through: the invoice route builds complex data-driven HTML and injects
    // it as the {{invoice_html}} variable.
    body_html: '{{invoice_html}}',
  },

  email_template_contract: {
    subject: 'Contract: {{contract_title}} — Please Review and Sign',
    body_html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Hello {{first_name}},</h2>
  <p>You have a new contract to review and sign: <strong>{{contract_title}}</strong></p>
  {{#message}}<p>{{message}}</p>{{/message}}
  <p style="margin: 24px 0;">
    <a href="{{action_url}}"
       style="background-color: #0047AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Review &amp; Sign Contract
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
</div>`,
  },
};

interface EmailTemplate {
  subject: string;
  body_html: string;
}

/**
 * Fetch an email template for a tenant, falling back to the built-in default.
 *
 * Uses the service role client to bypass RLS on system_settings (since the
 * calling user may not be an admin).
 *
 * @param tenantId    - The tenant UUID
 * @param templateKey - One of the email_template_* keys
 * @returns The template with subject and body_html
 */
export async function getEmailTemplate(
  tenantId: string,
  templateKey: string
): Promise<EmailTemplate> {
  const serviceClient = createAdminServiceClient();

  const { data: setting } = await serviceClient
    .from('system_settings')
    .select('value')
    .eq('tenant_id', tenantId)
    .eq('key', templateKey)
    .maybeSingle();

  if (setting?.value) {
    const val = setting.value as { subject?: string; body_html?: string };
    const defaults = DEFAULT_TEMPLATES[templateKey];
    return {
      subject: val.subject || defaults?.subject || '',
      body_html: val.body_html || defaults?.body_html || '',
    };
  }

  return DEFAULT_TEMPLATES[templateKey] ?? { subject: '', body_html: '' };
}

/**
 * Render a template by replacing `{{variable}}` placeholders with provided values.
 *
 * Also supports conditional blocks: `{{#key}}content{{/key}}` renders only if
 * the key is truthy in the variables map.
 *
 * @param template  - The template string with `{{placeholders}}`
 * @param variables - Key-value map of replacements
 * @returns The rendered string
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | undefined | null>
): string {
  let result = template;

  // Handle conditional blocks {{#key}}...{{/key}}
  result = result.replace(
    /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g,
    (_, key, content) => {
      return variables[key] ? content : '';
    }
  );

  // Replace {{variable}} placeholders
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] ?? '';
  });

  return result;
}
