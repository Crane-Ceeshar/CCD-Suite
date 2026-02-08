import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { createAdminServiceClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const { id } = await params;

  // Verify webhook belongs to tenant
  const { data: existing, error: fetchError } = await supabase
    .from('webhooks')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: { message: fetchError.message } },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { message: 'Webhook not found' } },
      { status: 404 }
    );
  }

  let body: { name?: string; url?: string; events?: string[]; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.url !== undefined) updates.url = body.url;
  if (body.events !== undefined) updates.events = body.events;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No valid fields to update' } },
      { status: 400 }
    );
  }

  const { data, error: updateError } = await supabase
    .from('webhooks')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  // Log webhook update
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'webhook.updated',
    resource_type: 'webhooks',
    resource_id: id,
    details: { updates },
  });

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const { id } = await params;

  // Verify webhook belongs to tenant
  const { data: existing, error: fetchError } = await supabase
    .from('webhooks')
    .select('id, name')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: { message: fetchError.message } },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { message: 'Webhook not found' } },
      { status: 404 }
    );
  }

  const { error: deleteError } = await supabase
    .from('webhooks')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  // Log webhook deletion
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'webhook.deleted',
    resource_type: 'webhooks',
    resource_id: id,
    details: { name: existing.name },
  });

  return NextResponse.json({ success: true, data: { id } });
}
