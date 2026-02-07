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
  const { name, description, is_enabled } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (is_enabled !== undefined) updates.is_enabled = is_enabled;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await serviceClient
    .from('feature_flags')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { message: updateError?.message ?? 'Flag not found' } },
      { status: 404 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'feature_flag.updated',
    resource_type: 'feature_flag',
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
    .from('feature_flags')
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
    action: 'feature_flag.deleted',
    resource_type: 'feature_flag',
    resource_id: id,
    details: {},
  });

  return NextResponse.json({ success: true, data: null });
}
