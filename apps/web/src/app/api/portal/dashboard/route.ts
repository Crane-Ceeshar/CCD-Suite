import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/supabase/auth-helpers';
import { success, dbError } from '@/lib/api/responses';

/**
 * GET /api/portal/dashboard
 * Portal dashboard data: project overview, recent activity, pending actions.
 */
export async function GET(_request: NextRequest) {
  const { error, supabase } = await requireAuth();
  if (error) return error;

  // Get all portal projects with milestone/deliverable/message counts
  const { data: projects, error: projectsError } = await supabase
    .from('portal_projects')
    .select('id, name, status, progress, start_date, end_date')
    .order('created_at', { ascending: false });

  if (projectsError) {
    return dbError(projectsError, 'Failed to fetch dashboard data');
  }

  const projectList = projects ?? [];

  // Get counts for each project
  const enriched = await Promise.all(
    projectList.map(async (p: { id: string }) => {
      const [milestonesRes, deliverablesRes, messagesRes, pendingRes, unreadMsgRes] = await Promise.all([
        supabase.from('portal_milestones').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id),
        supabase.from('portal_deliverables').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id),
        supabase.from('portal_messages').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id),
        supabase.from('portal_deliverables').select('id', { count: 'exact', head: true }).eq('portal_project_id', p.id).eq('status', 'pending_review'),
        // Latest message date
        supabase.from('portal_messages').select('created_at').eq('portal_project_id', p.id).order('created_at', { ascending: false }).limit(1),
      ]);

      return {
        ...p,
        milestone_count: milestonesRes.count ?? 0,
        deliverable_count: deliverablesRes.count ?? 0,
        message_count: messagesRes.count ?? 0,
        pending_deliverables: pendingRes.count ?? 0,
        last_activity: unreadMsgRes.data?.[0]?.created_at ?? null,
      };
    })
  );

  // Get recent notifications
  const { data: notifications } = await supabase
    .from('portal_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  // Summary stats
  const totalProjects = projectList.length;
  const activeProjects = projectList.filter((p: { status: string }) => p.status === 'active').length;
  const totalPendingDeliverables = enriched.reduce((sum, p) => sum + p.pending_deliverables, 0);

  return success({
    projects: enriched,
    notifications: notifications ?? [],
    stats: {
      total_projects: totalProjects,
      active_projects: activeProjects,
      pending_deliverables: totalPendingDeliverables,
    },
  });
}
