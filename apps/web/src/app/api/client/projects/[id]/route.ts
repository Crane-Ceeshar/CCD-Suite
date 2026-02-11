import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/portal/client-session';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * GET /api/client/projects/:id
 * Returns a single portal project with milestones, deliverables, and non-internal messages.
 * Scoped to the client's session.
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

  // If session is project-scoped, validate access
  if (session.portal_project_id && session.portal_project_id !== id) {
    return NextResponse.json(
      { success: false, error: { message: 'Access denied to this project' } },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  // Fetch the project (must belong to same tenant)
  const { data: project, error: projectError } = await supabase
    .from('portal_projects')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', session.tenant_id)
    .single();

  if (projectError || !project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found' } },
      { status: 404 }
    );
  }

  // Fetch related data in parallel
  const [milestonesRes, deliverablesRes, messagesRes] = await Promise.all([
    supabase
      .from('portal_milestones')
      .select('*')
      .eq('portal_project_id', id)
      .order('position', { ascending: true }),
    supabase
      .from('portal_deliverables')
      .select('*')
      .eq('portal_project_id', id)
      .order('created_at', { ascending: false }),
    // Only non-internal messages for client view
    supabase
      .from('portal_messages')
      .select('*')
      .eq('portal_project_id', id)
      .eq('is_internal', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  // Enrich messages with sender profile data
  const messages = messagesRes.data ?? [];
  if (messages.length > 0) {
    const senderIds = [...new Set(
      messages
        .map((m: { sender_id: string | null }) => m.sender_id)
        .filter((sid: string | null): sid is string => sid !== null)
    )];

    if (senderIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', senderIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: { id: string; full_name: string; email: string; avatar_url: string | null }) => [p.id, p])
      );

      messages.forEach((msg: { sender_id: string | null; sender?: { id: string; full_name: string; email: string; avatar_url: string | null } | null }) => {
        msg.sender = msg.sender_id ? profileMap.get(msg.sender_id) ?? null : null;
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      ...project,
      milestones: milestonesRes.data ?? [],
      deliverables: deliverablesRes.data ?? [],
      messages,
    },
  });
}
