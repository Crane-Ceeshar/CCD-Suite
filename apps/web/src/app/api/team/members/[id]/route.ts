import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  // Cannot modify own role or deactivate self
  if (id === user.id) {
    return NextResponse.json(
      { success: false, error: { message: 'You cannot modify your own account from here' } },
      { status: 400 }
    );
  }

  // Verify target user belongs to same tenant
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, tenant_id, user_type')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!targetProfile) {
    return NextResponse.json(
      { success: false, error: { message: 'Team member not found' } },
      { status: 404 }
    );
  }

  // Cannot modify another owner/admin (only platform admin can do that)
  if (['admin', 'owner'].includes(targetProfile.user_type) && profile.user_type !== 'admin') {
    return NextResponse.json(
      { success: false, error: { message: 'Cannot modify an admin or owner account' } },
      { status: 403 }
    );
  }

  // Build update object
  const updates: Record<string, unknown> = {};
  if (body.user_type !== undefined) updates.user_type = body.user_type;
  if (body.role_title !== undefined) updates.role_title = body.role_title;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data, error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('id, email, full_name, avatar_url, user_type, role_title, is_active')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'team.member_updated',
    resource_type: 'profile',
    resource_id: id,
    details: updates,
  });

  return NextResponse.json({ success: true, data });
}
