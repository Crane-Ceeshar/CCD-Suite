import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const { id } = await params;
  const body = await request.json();
  const { title, message, type, is_active, starts_at, ends_at } = body;

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (message !== undefined) updates.message = message;
  if (type !== undefined) updates.type = type;
  if (is_active !== undefined) updates.is_active = is_active;
  if (starts_at !== undefined) updates.starts_at = starts_at;
  if (ends_at !== undefined) updates.ends_at = ends_at;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await serviceClient
    .from('system_announcements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { message: updateError?.message ?? 'Announcement not found' } },
      { status: 404 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'announcement.updated',
    resource_type: 'announcement',
    resource_id: id,
    details: updates,
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const { id } = await params;

  const { error: deleteError } = await serviceClient
    .from('system_announcements')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'announcement.deleted',
    resource_type: 'announcement',
    resource_id: id,
    details: {},
  });

  return NextResponse.json({ success: true, data: null });
}
