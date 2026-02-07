import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  const { data: flags, error: queryError } = await serviceClient
    .from('feature_flags')
    .select('*')
    .order('created_at', { ascending: false });

  if (queryError) {
    // Table may not exist yet if migrations haven't been applied
    if (queryError.code === '42P01') {
      return NextResponse.json({ success: true, data: [] });
    }
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Fetch all overrides
  const flagIds = (flags ?? []).map((f) => f.id);
  let overrides: Array<{ id: string; flag_id: string; tenant_id: string; is_enabled: boolean }> = [];

  if (flagIds.length > 0) {
    const { data } = await serviceClient
      .from('feature_flag_overrides')
      .select('id, flag_id, tenant_id, is_enabled')
      .in('flag_id', flagIds);
    overrides = data ?? [];
  }

  // Attach overrides to flags
  const enrichedFlags = (flags ?? []).map((flag) => ({
    ...flag,
    overrides: overrides.filter((o) => o.flag_id === flag.id),
  }));

  return NextResponse.json({ success: true, data: enrichedFlags });
}

export async function POST(request: NextRequest) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const body = await request.json();
  const { key, name, description, is_enabled } = body;

  if (!key || !name) {
    return NextResponse.json(
      { success: false, error: { message: 'Key and name are required' } },
      { status: 400 }
    );
  }

  const { data: flag, error: insertError } = await serviceClient
    .from('feature_flags')
    .insert({
      key: key.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      name,
      description: description || '',
      is_enabled: is_enabled ?? false,
      created_by: profile.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'feature_flag.created',
    resource_type: 'feature_flag',
    resource_id: flag.id,
    details: { key, name },
  });

  return NextResponse.json({ success: true, data: { ...flag, overrides: [] } }, { status: 201 });
}
