import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { createAdminServiceClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  let body: { settings?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { settings } = body;

  // Validate settings is an object with string keys
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    return NextResponse.json(
      { success: false, error: { message: 'settings must be a non-null object with string keys' } },
      { status: 400 }
    );
  }

  const entries = Object.entries(settings as Record<string, unknown>);
  if (entries.length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'settings object must not be empty' } },
      { status: 400 }
    );
  }

  let importedCount = 0;

  for (const [key, value] of entries) {
    // Check if setting already exists
    const { data: existing } = await supabase
      .from('system_settings')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('key', key)
      .maybeSingle();

    let result;

    if (existing) {
      result = await supabase
        .from('system_settings')
        .update({ value, updated_by: user.id })
        .eq('id', existing.id);
    } else {
      result = await supabase
        .from('system_settings')
        .insert({
          tenant_id: profile.tenant_id,
          key,
          value,
          updated_by: user.id,
        });
    }

    if (result.error) {
      return NextResponse.json(
        { success: false, error: { message: `Failed to import key "${key}": ${result.error.message}` } },
        { status: 500 }
      );
    }

    importedCount++;
  }

  // Log the import action
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'settings.imported',
    resource_type: 'system_settings',
    resource_id: null,
    details: { count: importedCount },
  });

  return NextResponse.json({
    success: true,
    data: { imported: importedCount },
  });
}
