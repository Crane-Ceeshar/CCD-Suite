import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

// Default templates (shown when no custom templates exist yet)
const DEFAULT_TEMPLATES = [
  {
    key: 'email_template_welcome',
    name: 'Welcome Email',
    subject: 'Welcome to CCD Suite',
    body_html: '<h1>Welcome!</h1><p>Thank you for joining CCD Suite. We\'re excited to have you on board.</p>',
  },
  {
    key: 'email_template_invite',
    name: 'User Invitation',
    subject: 'You\'ve been invited to CCD Suite',
    body_html: '<h1>You\'re Invited!</h1><p>An administrator has invited you to join their organisation on CCD Suite.</p>',
  },
  {
    key: 'email_template_password_reset',
    name: 'Password Reset',
    subject: 'Reset Your Password',
    body_html: '<h1>Password Reset</h1><p>Click the link below to reset your password.</p>',
  },
  {
    key: 'email_template_notification',
    name: 'General Notification',
    subject: 'CCD Suite Notification',
    body_html: '<h1>Notification</h1><p>You have a new notification from CCD Suite.</p>',
  },
];

export async function GET() {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  // Fetch custom templates from system_settings
  const { data: settings } = await serviceClient
    .from('system_settings')
    .select('key, value')
    .eq('tenant_id', profile.tenant_id)
    .like('key', 'email_template_%');

  // Build map of existing templates
  const customMap: Record<string, { subject: string; body_html: string }> = {};
  for (const s of settings ?? []) {
    const val = s.value as { subject?: string; body_html?: string } | null;
    if (val) {
      customMap[s.key] = {
        subject: val.subject || '',
        body_html: val.body_html || '',
      };
    }
  }

  // Merge defaults with custom templates
  const templates = DEFAULT_TEMPLATES.map((t) => ({
    key: t.key,
    name: t.name,
    subject: customMap[t.key]?.subject ?? t.subject,
    body_html: customMap[t.key]?.body_html ?? t.body_html,
    is_customized: !!customMap[t.key],
  }));

  return NextResponse.json({ success: true, data: templates });
}

export async function POST(request: NextRequest) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const body = await request.json();
  const { key, subject, body_html } = body;

  if (!key) {
    return NextResponse.json(
      { success: false, error: { message: 'Template key is required' } },
      { status: 400 }
    );
  }

  // Upsert into system_settings
  const { error: upsertError } = await serviceClient
    .from('system_settings')
    .upsert(
      {
        tenant_id: profile.tenant_id,
        key,
        value: { subject, body_html },
        updated_by: profile.id,
      },
      { onConflict: 'tenant_id,key' }
    );

  if (upsertError) {
    return NextResponse.json(
      { success: false, error: { message: upsertError.message } },
      { status: 500 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'settings.updated',
    resource_type: 'email_template',
    resource_id: null,
    details: { key },
  });

  return NextResponse.json({ success: true, data: { key, subject, body_html } });
}
