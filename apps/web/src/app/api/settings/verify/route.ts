import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { createAdminServiceClient } from '@/lib/supabase/admin';

/**
 * POST — Send a verification code (placeholder: always succeeds)
 */
export async function POST(request: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { type, value } = body;

  if (!type || !value) {
    return NextResponse.json(
      { success: false, error: { message: 'type and value are required' } },
      { status: 400 }
    );
  }

  if (!['email', 'phone'].includes(type)) {
    return NextResponse.json(
      { success: false, error: { message: 'type must be "email" or "phone"' } },
      { status: 400 }
    );
  }

  // Placeholder: In production, send a real verification code via email/SMS
  // For now, always return success after a brief simulated delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return NextResponse.json({
    success: true,
    message: 'Verification code sent',
  });
}

/**
 * PATCH — Verify a code and update the profile (placeholder: accepts any 6-digit code)
 */
export async function PATCH(request: NextRequest) {
  const { error, user, profile } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { type, value, code } = body;

  if (!type || !value || !code) {
    return NextResponse.json(
      { success: false, error: { message: 'type, value, and code are required' } },
      { status: 400 }
    );
  }

  if (!['email', 'phone'].includes(type)) {
    return NextResponse.json(
      { success: false, error: { message: 'type must be "email" or "phone"' } },
      { status: 400 }
    );
  }

  // Placeholder: accept any 6-digit code
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid verification code' } },
      { status: 400 }
    );
  }

  const adminClient = createAdminServiceClient();

  // Update the profile
  const updateField = type === 'email' ? 'email' : 'phone';
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ [updateField]: value })
    .eq('id', user.id);

  if (profileError) {
    return NextResponse.json(
      { success: false, error: { message: profileError.message } },
      { status: 500 }
    );
  }

  // If email change, also update auth.users email via admin client
  if (type === 'email') {
    try {
      await adminClient.auth.admin.updateUserById(user.id, { email: value });
    } catch {
      // Non-fatal: profile was updated, auth email update is best-effort
    }
  }

  // Log the change
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: `user.${type}_verified`,
    resource_type: 'user',
    resource_id: user.id,
    details: { type, new_value: value },
  });

  return NextResponse.json({
    success: true,
    message: 'Verified and updated',
  });
}
