import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';

export async function GET() {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  // Fetch all profiles in the tenant
  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, user_type, role_title, is_active, created_at')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: true });

  if (membersError) {
    return NextResponse.json(
      { success: false, error: { message: membersError.message } },
      { status: 500 }
    );
  }

  // Fetch pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('pending_invitations')
    .select('id, email, user_type, invited_by, message, status, created_at, expires_at')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false });

  if (invitationsError) {
    return NextResponse.json(
      { success: false, error: { message: invitationsError.message } },
      { status: 500 }
    );
  }

  // Get tenant max_users
  const { data: tenant } = await supabase
    .from('tenants')
    .select('max_users, plan')
    .eq('id', profile.tenant_id)
    .single();

  const activeCount = members?.filter((m) => m.is_active).length ?? 0;
  const pendingCount = invitations?.filter((i) => i.status === 'pending').length ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      members: members ?? [],
      invitations: invitations ?? [],
      max_users: tenant?.max_users ?? 5,
      plan: tenant?.plan ?? 'starter',
      active_count: activeCount,
      pending_count: pendingCount,
      total_used: activeCount + pendingCount,
    },
  });
}
