import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const { data: tenant, error: queryError } = await supabase
    .from('tenants')
    .select('id, name, slug, plan, logo_url, settings, created_at, updated_at')
    .eq('id', profile.tenant_id)
    .single();

  if (queryError || !tenant) {
    return NextResponse.json(
      { success: false, error: { message: queryError?.message ?? 'Tenant not found' } },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: tenant });
}

export async function PATCH(request: NextRequest) {
  const { error, supabase, profile } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
  if (body.settings !== undefined) updates.settings = body.settings;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'No fields to update' } },
      { status: 400 }
    );
  }

  const { data: tenant, error: updateError } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', profile.tenant_id)
    .select('id, name, slug, plan, logo_url, settings, created_at, updated_at')
    .single();

  if (updateError || !tenant) {
    return NextResponse.json(
      { success: false, error: { message: updateError?.message ?? 'Update failed' } },
      { status: 500 }
    );
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'tenant.updated',
    resource_type: 'tenant',
    resource_id: profile.tenant_id,
    details: { updated_fields: Object.keys(updates) },
  });

  return NextResponse.json({ success: true, data: tenant });
}
