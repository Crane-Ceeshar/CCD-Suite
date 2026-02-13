import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { createAdminServiceClient } from '@/lib/supabase/admin';

/** Setting keys that any authenticated user can edit (not just admins) */
const USER_SCOPED_KEYS = ['platform.profile', 'platform.appearance', 'platform.notifications'];

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
  const { error, supabase, user, profile } = await requireAuth();
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

  // Non-user-scoped settings require admin or owner role
  if (!USER_SCOPED_KEYS.includes(settingKey)) {
    if (!['admin', 'owner'].includes(profile.user_type)) {
      return NextResponse.json(
        { success: false, error: { message: 'Forbidden — admin or owner access required' } },
        { status: 403 }
      );
    }
  }

  // Fetch existing value for diff logging
  const { data: oldSetting } = await supabase
    .from('system_settings')
    .select('value')
    .eq('tenant_id', profile.tenant_id)
    .eq('key', settingKey)
    .maybeSingle();

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

  // Compute shallow diff and log changes using Map (avoids property injection)
  const adminClient = createAdminServiceClient();
  const oldVal = oldSetting?.value ?? {};
  const changes = new Map<string, { old: unknown; new: unknown }>();
  if (typeof value === 'object' && value && typeof oldVal === 'object' && oldVal) {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (!Object.prototype.hasOwnProperty.call(value, k)) continue;
      const oldV = (oldVal as Record<string, unknown>)[k];
      if (JSON.stringify(v) !== JSON.stringify(oldV)) {
        changes.set(k, { old: oldV, new: v });
      }
    }
  }
  if (changes.size > 0) {
    await adminClient.from('activity_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'settings.updated',
      resource_type: 'system_settings',
      resource_id: null,
      details: { module: moduleName, key, changes: Object.fromEntries(changes) },
    });
  }

  return NextResponse.json({ success: true, data: result.data });
}
