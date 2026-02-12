import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { requireTenantAdmin, createAdminServiceClient } from '@/lib/supabase/tenant-admin';
import { sendEmail } from '@/lib/email';
import { getEmailTemplate, renderTemplate } from '@/lib/api/email-templates';

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const body = await request.json();
  const { email, user_type, message } = body;

  if (!email || !user_type) {
    return NextResponse.json(
      { success: false, error: { message: 'email and user_type are required' } },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid email address' } },
      { status: 400 }
    );
  }

  // Get tenant info including max_users
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug, max_users')
    .eq('id', profile.tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json(
      { success: false, error: { message: 'Tenant not found' } },
      { status: 404 }
    );
  }

  // Count current active members
  const { count: memberCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)
    .eq('is_active', true);

  // Count pending invitations
  const { count: pendingCount } = await supabase
    .from('pending_invitations')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'pending');

  const totalUsed = (memberCount ?? 0) + (pendingCount ?? 0);

  if (totalUsed >= tenant.max_users) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: `Team member limit reached (${tenant.max_users}). Upgrade your plan to invite more members.`,
          code: 'MEMBER_LIMIT_REACHED',
        },
      },
      { status: 403 }
    );
  }

  // Check for existing user with same email in this tenant
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    return NextResponse.json(
      { success: false, error: { message: 'A team member with this email already exists' } },
      { status: 409 }
    );
  }

  // Check for existing pending invitation
  const { data: existingInvite } = await supabase
    .from('pending_invitations')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (existingInvite) {
    return NextResponse.json(
      { success: false, error: { message: 'An invitation has already been sent to this email' } },
      { status: 409 }
    );
  }

  // Generate invite token
  const token = randomBytes(32).toString('hex');

  // Create auth user via service role
  const serviceClient = createAdminServiceClient();
  const tempPassword = randomBytes(16).toString('hex');

  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email: email.toLowerCase(),
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      tenant_id: profile.tenant_id,
      user_type,
      full_name: '',
      invited_by: user.id,
    },
  });

  if (createError) {
    // If user already exists in auth.users (different tenant), still send invite
    if (createError.message.includes('already been registered')) {
      return NextResponse.json(
        { success: false, error: { message: 'This email is already registered on the platform' } },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: { message: createError.message } },
      { status: 400 }
    );
  }

  // Wait for trigger to create profile
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update profile with correct tenant details
  if (newUser.user) {
    await serviceClient
      .from('profiles')
      .update({
        user_type,
        tenant_id: profile.tenant_id,
      })
      .eq('id', newUser.user.id);
  }

  // Insert pending invitation record
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await supabase.from('pending_invitations').insert({
    tenant_id: profile.tenant_id,
    email: email.toLowerCase(),
    user_type,
    invited_by: user.id,
    message: message || null,
    token,
    expires_at: expiresAt.toISOString(),
  });

  // Send invitation email
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'ccdsuite.com';
  const dashboardUrl = tenant.slug
    ? `https://${tenant.slug}.${baseDomain}/dashboard`
    : `https://${baseDomain}/dashboard`;

  try {
    const template = await getEmailTemplate(profile.tenant_id, 'email_template_invite');
    const vars = {
      inviter_name: profile.full_name || profile.email,
      tenant_name: tenant.name,
      user_type,
      message: message || '',
      action_url: dashboardUrl,
      email: email.toLowerCase(),
      temp_password: tempPassword,
    };
    await sendEmail({
      to: email.toLowerCase(),
      subject: renderTemplate(template.subject, vars),
      html: renderTemplate(template.body_html, vars),
    });
  } catch {
    // Email sending failed but user was created — still return success
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'team.member_invited',
    resource_type: 'invitation',
    resource_id: newUser.user?.id,
    details: { email, user_type, invited_by: profile.full_name || profile.email },
  });

  return NextResponse.json({
    success: true,
    data: {
      email: email.toLowerCase(),
      user_type,
      status: 'pending',
    },
  }, { status: 201 });
}
