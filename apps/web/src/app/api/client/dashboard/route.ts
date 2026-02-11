import { NextRequest, NextResponse } from 'next/server';
import { getClientSession } from '@/lib/portal/client-session';
import { createServiceClient } from '@/lib/supabase/service-client';

/**
 * GET /api/client/dashboard
 * Returns portal project data for the authenticated client.
 * Uses portal_session cookie instead of Supabase auth.
 */
export async function GET(request: NextRequest) {
  const session = getClientSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: 'Unauthorized — no valid portal session' } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  // Fetch portal projects scoped to this tenant
  let query = supabase
    .from('portal_projects')
    .select('id, name, status, progress, start_date, end_date, description')
    .eq('tenant_id', session.tenant_id)
    .order('created_at', { ascending: false });

  // If session is scoped to a specific project, only show that one
  if (session.portal_project_id) {
    query = query.eq('id', session.portal_project_id);
  }

  const { data: projects, error: projectsError } = await query;

  if (projectsError) {
    return NextResponse.json(
      { success: false, error: { message: 'Failed to fetch projects' } },
      { status: 500 }
    );
  }

  const projectList = projects ?? [];

  // Enrich with milestone/deliverable counts
  const enriched = await Promise.all(
    projectList.map(async (p: { id: string }) => {
      const [milestonesRes, deliverablesRes, messagesRes, pendingRes] = await Promise.all([
        supabase.from('portal_milestones').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id),
        supabase.from('portal_deliverables').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id),
        supabase.from('portal_messages').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id).eq('is_internal', false),
        supabase.from('portal_deliverables').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id).eq('status', 'pending_review'),
      ]);

      return {
        ...p,
        milestone_count: milestonesRes.count ?? 0,
        deliverable_count: deliverablesRes.count ?? 0,
        message_count: messagesRes.count ?? 0,
        pending_deliverables: pendingRes.count ?? 0,
      };
    })
  );

  const totalProjects = projectList.length;
  const activeProjects = projectList.filter((p: { status: string }) => p.status === 'active').length;
  const totalPending = enriched.reduce((sum, p) => sum + p.pending_deliverables, 0);

  return NextResponse.json({
    success: true,
    data: {
      client_email: session.client_email,
      projects: enriched,
      stats: {
        total_projects: totalProjects,
        active_projects: activeProjects,
        pending_deliverables: totalPending,
      },
    },
  });
}
