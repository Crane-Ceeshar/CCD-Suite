import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/portal/client-session';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * GET /api/client/projects/:id/messages
 * List non-internal messages for a portal project.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getClientSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (session.portal_project_id && session.portal_project_id !== id) {
    return NextResponse.json(
      { success: false, error: { message: 'Access denied' } },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  // Verify project belongs to tenant
  const { data: project } = await supabase
    .from('portal_projects')
    .select('id')
    .eq('id', id)
    .eq('tenant_id', session.tenant_id)
    .single();

  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  const { data: messages, error } = await supabase
    .from('portal_messages')
    .select('*')
    .eq('portal_project_id', id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch messages' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: messages ?? [] });
}

/**
 * POST /api/client/projects/:id/messages
 * Send a message as a client.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = getClientSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized' } },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (session.portal_project_id && session.portal_project_id !== id) {
    return NextResponse.json(
      { success: false, error: { message: 'Access denied' } },
      { status: 403 }
    );
  }

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  if (!body.content?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: 'Message content is required' } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify project belongs to tenant
  const { data: project } = await supabase
    .from('portal_projects')
    .select('id, tenant_id')
    .eq('id', id)
    .eq('tenant_id', session.tenant_id)
    .single();

  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  const { data: message, error } = await supabase
    .from('portal_messages')
    .insert({
      tenant_id: session.tenant_id,
      portal_project_id: id,
      sender_id: null, // No authenticated user — client guest
      sender_email: session.client_email,
      content: body.content.trim(),
      is_internal: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: { message: error.message || 'Failed to send message' } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: message }, { status: 201 });
}
