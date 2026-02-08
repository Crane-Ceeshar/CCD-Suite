import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';

export async function GET(request: NextRequest) {
  const { error, supabase, profile } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module');
  const key = searchParams.get('key');

  if (!moduleName) {
    return NextResponse.json(
      { success: false, error: { message: 'module parameter is required' } },
      { status: 400 }
    );
  }

  // If a specific key is provided, fetch that one setting
  if (key) {
    const settingKey = `${moduleName}.${key}`;
    const { data, error: queryError } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('tenant_id', profile.tenant_id)
      .eq('key', settingKey)
      .maybeSingle();

    if (queryError) {
      return NextResponse.json(
        { success: false, error: { message: queryError.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data?.value ?? null,
    });
  }

  // Fetch all settings for this module
  const { data, error: queryError } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('tenant_id', profile.tenant_id)
    .like('key', `${moduleName}.%`);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Transform into an object: { "emails.signature": {...}, "pipeline.default": {...} }
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    const subKey = row.key.replace(`${moduleName}.`, '');
    settings[subKey] = row.value;
  }

  return NextResponse.json({ success: true, data: settings });
}

export async function PATCH(request: NextRequest) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const body = await request.json();
  const { module: moduleName, key, value } = body;

  if (!moduleName || !key) {
    return NextResponse.json(
      { success: false, error: { message: 'module and key are required' } },
      { status: 400 }
    );
  }

  const settingKey = `${moduleName}.${key}`;

  // Upsert into system_settings
  const { data: existing } = await supabase
    .from('system_settings')
    .select('id')
    .eq('tenant_id', profile.tenant_id)
    .eq('key', settingKey)
    .maybeSingle();

  let result;

  if (existing) {
    result = await supabase
      .from('system_settings')
      .update({ value, updated_by: user.id })
      .eq('id', existing.id)
      .select('key, value')
      .single();
  } else {
    result = await supabase
      .from('system_settings')
      .insert({
        tenant_id: profile.tenant_id,
        key: settingKey,
        value,
        updated_by: user.id,
      })
      .select('key, value')
      .single();
  }

  if (result.error) {
    return NextResponse.json(
      { success: false, error: { message: result.error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
