import { NextRequest, NextResponse } from 'next/server';
import { requireTenantAdmin } from '@/lib/supabase/tenant-admin';
import { createAdminServiceClient } from '@/lib/supabase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, supabase, user, profile } = await requireTenantAdmin();
  if (error) return error;

  const { id } = await params;

  // Fetch webhook by ID
  const { data: webhook, error: fetchError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: { message: fetchError.message } },
      { status: 500 }
    );
  }

  if (!webhook) {
    return NextResponse.json(
      { success: false, error: { message: 'Webhook not found' } },
      { status: 404 }
    );
  }

  // Send test webhook
  const startTime = Date.now();
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': webhook.secret,
      },
      body: JSON.stringify({
        event: 'test',
        timestamp: new Date().toISOString(),
        data: { message: 'This is a test webhook from CCD Suite' },
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    // Log webhook test
    const adminClient = createAdminServiceClient();
    await adminClient.from('activity_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'webhook.tested',
      resource_type: 'webhooks',
      resource_id: id,
      details: {
        name: webhook.name,
        url: webhook.url,
        status_code: response.status,
        response_time_ms: responseTimeMs,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        status_code: response.status,
        response_time_ms: responseTimeMs,
      },
    });
  } catch (err) {
    const responseTimeMs = Date.now() - startTime;

    // Log failed test
    const adminClient = createAdminServiceClient();
    await adminClient.from('activity_logs').insert({
      tenant_id: profile.tenant_id,
      user_id: user.id,
      action: 'webhook.tested',
      resource_type: 'webhooks',
      resource_id: id,
      details: {
        name: webhook.name,
        url: webhook.url,
        error: err instanceof Error ? err.message : 'Unknown error',
        response_time_ms: responseTimeMs,
      },
    });

    return NextResponse.json({
      success: false,
      error: {
        message: `Webhook test failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      },
      data: {
        status_code: null,
        response_time_ms: responseTimeMs,
      },
    });
  }
}
