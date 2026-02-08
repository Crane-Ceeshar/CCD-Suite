import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET(_request: NextRequest) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('system_settings')
    .select('key, value')
    .eq('tenant_id', profile.tenant_id);

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  // Transform rows into { [key]: value } object
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  // Log the export action
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'settings.exported',
    resource_type: 'system_settings',
    resource_id: null,
    details: { count: Object.keys(settings).length },
  });

  return NextResponse.json({
    success: true,
    data: {
      version: '1.0',
      exported_at: new Date().toISOString(),
      tenant_id: profile.tenant_id,
      settings,
    },
  });
}
