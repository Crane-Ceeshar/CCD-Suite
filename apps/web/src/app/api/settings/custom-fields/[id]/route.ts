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

  // Verify custom field belongs to tenant
  const { data: existing, error: fetchError } = await supabase
    .from('custom_field_definitions')
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
      { success: false, error: { message: 'Custom field not found' } },
      { status: 404 }
    );
  }

  let body: {
    field_label?: string;
    field_type?: string;
    options?: unknown[];
    is_required?: boolean;
    sort_order?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.field_label !== undefined) updates.field_label = body.field_label;
  if (body.field_type !== undefined) {
    const validTypes = ['text', 'number', 'date', 'select', 'boolean', 'url', 'email'];
    if (!validTypes.includes(body.field_type)) {
      return NextResponse.json(
        { success: false, error: { message: `field_type must be one of: ${validTypes.join(', ')}` } },
        { status: 400 }
      );
    }
    updates.field_type = body.field_type;
  }
  if (body.options !== undefined) updates.options = body.options;
  if (body.is_required !== undefined) updates.is_required = body.is_required;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No valid fields to update' } },
      { status: 400 }
    );
  }

  const { data, error: updateError } = await supabase
    .from('custom_field_definitions')
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

  // Log custom field update
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'custom_field.updated',
    resource_type: 'custom_field_definitions',
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

  // Verify custom field belongs to tenant
  const { data: existing, error: fetchError } = await supabase
    .from('custom_field_definitions')
    .select('id, field_label, module, entity_type')
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
      { success: false, error: { message: 'Custom field not found' } },
      { status: 404 }
    );
  }

  const { error: deleteError } = await supabase
    .from('custom_field_definitions')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  // Log custom field deletion
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'custom_field.deleted',
    resource_type: 'custom_field_definitions',
    resource_id: id,
    details: {
      field_label: existing.field_label,
      module: existing.module,
      entity_type: existing.entity_type,
    },
  });

  return NextResponse.json({ success: true, data: { id } });
}
