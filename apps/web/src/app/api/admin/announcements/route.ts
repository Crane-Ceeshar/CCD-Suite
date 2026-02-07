import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createAdminServiceClient } from '@/lib/supabase/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();

  const { data, error: queryError } = await serviceClient
    .from('system_announcements')
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

  return NextResponse.json({ success: true, data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const { error, profile } = await requireAdmin();
  if (error) return error;

  const serviceClient = createAdminServiceClient();
  const body = await request.json();
  const { title, message, type, starts_at, ends_at, tenant_id } = body;

  if (!title || !message) {
    return NextResponse.json(
      { success: false, error: { message: 'Title and message are required' } },
      { status: 400 }
    );
  }

  const { data: announcement, error: insertError } = await serviceClient
    .from('system_announcements')
    .insert({
      title,
      message,
      type: type || 'info',
      starts_at: starts_at || new Date().toISOString(),
      ends_at: ends_at || null,
      tenant_id: tenant_id || null,
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

  // Log activity
  await serviceClient.from('activity_logs').insert({
    tenant_id: profile.tenant_id,
    user_id: profile.id,
    action: 'announcement.created',
    resource_type: 'announcement',
    resource_id: announcement.id,
    details: { title, type },
  });

  return NextResponse.json({ success: true, data: announcement }, { status: 201 });
}
