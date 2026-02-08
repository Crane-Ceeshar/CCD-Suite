import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, profile } = await requireTenantAdmin();
  if (error) return error;

  const { id } = await params;
  const body = await request.json();

  // Verify role belongs to tenant and is not a system role
  const { data: existing } = await supabase
    .from('user_type_definitions')
    .select('id, is_system')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { message: 'Role not found' } },
      { status: 404 }
    );
  }

  if (existing.is_system) {
    return NextResponse.json(
      { success: false, error: { message: 'System roles cannot be modified' } },
      { status: 403 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.modules !== undefined) updates.modules = body.modules;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data, error: updateError } = await supabase
    .from('user_type_definitions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: { message: updateError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, profile } = await requireTenantAdmin();
  if (error) return error;

  const { id } = await params;

  // Verify role belongs to tenant and is not a system role
  const { data: existing } = await supabase
    .from('user_type_definitions')
    .select('id, is_system, slug')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { message: 'Role not found' } },
      { status: 404 }
    );
  }

  if (existing.is_system) {
    return NextResponse.json(
      { success: false, error: { message: 'System roles cannot be deleted' } },
      { status: 403 }
    );
  }

  // Check if any profiles are using this custom role
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', profile.tenant_id)
    .eq('user_type', existing.slug);

  if (count && count > 0) {
    return NextResponse.json(
      { success: false, error: { message: `Cannot delete — ${count} member(s) are assigned this role` } },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from('user_type_definitions')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
