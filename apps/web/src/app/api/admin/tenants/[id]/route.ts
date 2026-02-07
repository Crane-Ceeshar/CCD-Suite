import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const { id } = await params;

  const { data: tenant, error: queryError } = await serviceClient
    .from('tenants')
    .select('id, name, slug, plan, is_active, max_users, trial_ends_at, settings, created_at, updated_at')
    .eq('id', id)
    .single();

  if (queryError || !tenant) {
    return NextResponse.json(
      { success: false, error: { message: 'Tenant not found' } },
      { status: 404 }
    );
  }

  // Get user count
  const { count } = await serviceClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', id);

  return NextResponse.json({
    success: true,
    data: { ...tenant, user_count: count ?? 0 },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const { id } = await params;
  const body = await request.json();
  const { name, plan, is_active, max_users, trial_ends_at } = body;

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (plan !== undefined) updates.plan = plan;
  if (is_active !== undefined) updates.is_active = is_active;
  if (max_users !== undefined) updates.max_users = max_users;
  if (trial_ends_at !== undefined) updates.trial_ends_at = trial_ends_at;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await serviceClient
    .from('tenants')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { success: false, error: { message: updateError?.message ?? 'Tenant not found' } },
      { status: 404 }
    );
  }

  // Log activity
  const action = is_active === false ? 'tenant.suspended' : 'tenant.updated';
  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action,
    resource_type: 'tenant',
    resource_id: id,
    details: updates,
  });

  return NextResponse.json({ success: true, data: updated });
}
