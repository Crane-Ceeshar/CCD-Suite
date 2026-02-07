import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();
  const { full_name, user_type, is_active } = body;

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (user_type !== undefined) updates.user_type = user_type;
  if (is_active !== undefined) updates.is_active = is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .select('id, email, full_name, avatar_url, user_type, is_active, created_at')
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { message: updateError?.message ?? 'User not found' } },
      { status: 404 }
    );
  }

  // Log activity
  const action = is_active === false ? 'user.deactivated' : 'user.updated';
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action,
    resource_type: 'user',
    resource_id: id,
    details: updates,
  });

  return NextResponse.json({ success: true, data: updated });
}
