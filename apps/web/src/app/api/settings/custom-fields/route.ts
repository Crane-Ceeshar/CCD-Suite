import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const { error, supabase, profile } = await requireTenantAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const moduleName = searchParams.get('module');
  const entityType = searchParams.get('entity_type');

  let query = supabase
    .from('custom_field_definitions')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('sort_order', { ascending: true });

  if (moduleName) {
    query = query.eq('module', moduleName);
  }

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error: queryError } = await query;

  if (queryError) {
    return NextResponse.json(
      { success: false, error: { message: queryError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: NextRequest) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  let body: {
    module?: string;
    entity_type?: string;
    field_label?: string;
    field_type?: string;
    options?: unknown[];
    is_required?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { module: fieldModule, entity_type, field_label, field_type, options, is_required } = body;

  if (!fieldModule || !entity_type || !field_label || !field_type) {
    return NextResponse.json(
      { success: false, error: { message: 'module, entity_type, field_label, and field_type are required' } },
      { status: 400 }
    );
  }

  const validTypes = ['text', 'number', 'date', 'select', 'boolean', 'url', 'email'];
  if (!validTypes.includes(field_type)) {
    return NextResponse.json(
      { success: false, error: { message: `field_type must be one of: ${validTypes.join(', ')}` } },
      { status: 400 }
    );
  }

  // Auto-generate field_name from field_label
  const field_name = field_label
    .toLowerCase()
    .replace(/[^a-z0-9\s_]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  // Determine sort_order (max existing + 1)
  const { data: maxRow } = await supabase
    .from('custom_field_definitions')
    .select('sort_order')
    .eq('tenant_id', profile.tenant_id)
    .eq('module', fieldModule)
    .eq('entity_type', entity_type)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data, error: insertError } = await supabase
    .from('custom_field_definitions')
    .insert({
      tenant_id: profile.tenant_id,
      module: fieldModule,
      entity_type,
      field_name,
      field_label,
      field_type,
      options: options ?? [],
      is_required: is_required ?? false,
      sort_order,
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  // Log custom field creation
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'custom_field.created',
    resource_type: 'custom_field_definitions',
    resource_id: data.id,
    details: { module: fieldModule, entity_type, field_label, field_type },
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
