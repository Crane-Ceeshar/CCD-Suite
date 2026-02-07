import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const { email, full_name, user_type } = body;

  if (!email || !full_name || !user_type) {
    return NextResponse.json(
      { success: false, error: { message: 'email, full_name, and user_type are required' } },
      { status: 400 }
    );
  }

  // Use service role client to create auth user
  const serviceClient = createAdminServiceClient();

  const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      tenant_id: profile.tenant_id,
      user_type,
      full_name,
    },
  });

  if (createError) {
    return NextResponse.json(
      { success: false, error: { message: createError.message } },
      { status: 400 }
    );
  }

  // Wait briefly for the handle_new_user trigger to create the profile
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Update the profile with correct details (in case trigger defaults differ)
  if (newUser.user) {
    await serviceClient
      .from('profiles')
      .update({
        full_name,
        user_type,
        tenant_id: profile.tenant_id,
      })
      .eq('id', newUser.user.id);
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'user.created',
    resource_type: 'user',
    resource_id: newUser.user?.id,
    details: { email, user_type },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: newUser.user?.id,
      email,
      full_name,
      user_type,
    },
  });
}
