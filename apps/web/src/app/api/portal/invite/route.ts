import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { contact_id, portal_project_id } = body as {
    contact_id: string;
    portal_project_id?: string;
  };

  if (!contact_id) {
    return NextResponse.json(
      { success: false, error: { message: 'contact_id is required' } },
      { status: 400 }
    );
  }

  // Fetch the contact
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, email, first_name, last_name, company_id')
    .eq('id', contact_id)
    .single();

  if (contactError || !contact) {
    return NextResponse.json(
      { success: false, error: { message: 'Contact not found' } },
      { status: 404 }
    );
  }

  if (!contact.email) {
    return NextResponse.json(
      { success: false, error: { message: 'Contact has no email address' } },
      { status: 400 }
    );
  }

  // If no portal project, create one linked to the contact
  let projectId = portal_project_id;
  if (!projectId) {
    const { data: newProject, error: projectError } = await supabase
      .from('portal_projects')
      .insert({
        tenant_id: profile.tenant_id,
        name: `Portal - ${contact.first_name} ${contact.last_name}`,
        client_email: contact.email,
        contact_id: contact.id,
        status: 'active',
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      return NextResponse.json(
        { success: false, error: { message: projectError.message } },
        { status: 500 }
      );
    }
    projectId = newProject.id;
  }

  // Generate magic link token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const { error: tokenError } = await supabase
    .from('portal_access_tokens')
    .insert({
      tenant_id: profile.tenant_id,
      client_email: contact.email,
      token_hash: tokenHash,
      portal_project_id: projectId,
      expires_at: expiresAt,
      created_by: user.id,
    });

  if (tokenError) {
    return NextResponse.json(
      { success: false, error: { message: tokenError.message } },
      { status: 500 }
    );
  }

  // Build invitation URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ccdsuite.com';
  const inviteUrl = `${baseUrl}/portal/access?token=${token}&project=${projectId}`;

  // Send invitation email
  try {
    await sendEmail({
      to: contact.email,
      subject: 'You\'ve been invited to the Client Portal',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${contact.first_name},</h2>
          <p>You've been invited to access your client portal. Click the link below to get started:</p>
          <p style="margin: 24px 0;">
            <a href="${inviteUrl}"
               style="background-color: #0047AB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Portal
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
        </div>
      `,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: { message: err instanceof Error ? err.message : 'Failed to send invite' } },
      { status: 500 }
    );
  }

  // Log as activity
  await supabase.from('activities').insert({
    tenant_id: profile.tenant_id,
    type: 'email',
    title: `Portal invitation sent to ${contact.first_name} ${contact.last_name}`,
    description: `Invited ${contact.email} to the client portal`,
    contact_id: contact.id,
    company_id: contact.company_id,
    is_completed: true,
    completed_at: new Date().toISOString(),
    email_metadata: {
      subject: 'Portal Invitation',
      to: contact.email,
      sent_at: new Date().toISOString(),
      type: 'portal_invite',
    },
    created_by: user.id,
  });

  return NextResponse.json({
    success: true,
    data: {
      portal_project_id: projectId,
      invitation_sent: true,
    },
  }, { status: 201 });
}
