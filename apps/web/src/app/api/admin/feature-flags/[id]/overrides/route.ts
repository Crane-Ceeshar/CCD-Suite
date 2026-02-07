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

  const { data, error: queryError } = await serviceClient
    .from('feature_flag_overrides')
    .select('id, flag_id, tenant_id, is_enabled, tenants(name)')
    .eq('flag_id', id);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const { id } = await params;
  const body = await request.json();
  const { tenant_id, is_enabled } = body;

  if (!tenant_id || is_enabled === undefined) {
    return NextResponse.json(
      { success: false, error: { message: 'tenant_id and is_enabled are required' } },
      { status: 400 }
    );
  }

  // Upsert: insert or update on conflict
  const { data: override, error: upsertError } = await serviceClient
    .from('feature_flag_overrides')
    .upsert(
      { flag_id: id, tenant_id, is_enabled },
      { onConflict: 'flag_id,tenant_id' }
    )
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json(
      { success: false, error: { message: upsertError.message } },
      { status: 500 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'feature_flag.override_set',
    resource_type: 'feature_flag',
    resource_id: id,
    details: { tenant_id, is_enabled },
  });

  return NextResponse.json({ success: true, data: override });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get('tenant_id');

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: { message: 'tenant_id query parameter is required' } },
      { status: 400 }
    );
  }

  const { error: deleteError } = await serviceClient
    .from('feature_flag_overrides')
    .delete()
    .eq('flag_id', id)
    .eq('tenant_id', tenantId);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { message: deleteError.message } },
      { status: 500 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'feature_flag.override_removed',
    resource_type: 'feature_flag',
    resource_id: id,
    details: { tenant_id: tenantId },
  });

  return NextResponse.json({ success: true, data: null });
}
