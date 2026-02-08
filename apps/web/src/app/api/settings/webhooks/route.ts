import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { createAdminServiceClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

export async function GET(_request: NextRequest) {
  const { error, supabase, profile } = await requireTenantAdmin();
  if (error) return error;

  const { data, error: queryError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false });

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

  let body: { name?: string; url?: string; events?: string[]; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid JSON body' } },
      { status: 400 }
    );
  }

  const { name, url, events, is_active } = body;

  if (!name || !url || !events || !Array.isArray(events) || events.length === 0) {
    return NextResponse.json(
      { success: false, error: { message: 'name, url, and events (non-empty array) are required' } },
      { status: 400 }
    );
  }

  const secret = crypto.randomUUID();

  const { data, error: insertError } = await supabase
    .from('webhooks')
    .insert({
      tenant_id: profile.tenant_id,
      name,
      url,
      events,
      secret,
      is_active: is_active ?? true,
      created_by: user.id,
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { message: insertError.message } },
      { status: 500 }
    );
  }

  // Log webhook creation
  const adminClient = createAdminServiceClient();
  await adminClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: user.id,
    action: 'webhook.created',
    resource_type: 'webhooks',
    resource_id: data.id,
    details: { name, url, events },
  });

  return NextResponse.json({ success: true, data }, { status: 201 });
}
