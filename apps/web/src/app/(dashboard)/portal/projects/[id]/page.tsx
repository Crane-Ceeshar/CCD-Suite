'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, CcdSpinner } from '@ccd/ui';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiGet } from '@/lib/api';
import { MilestoneList } from '@/components/portal/milestone-list';
import { MilestoneDialog } from '@/components/portal/milestone-dialog';
import { DeliverableList } from '@/components/portal/deliverable-list';
import { DeliverableUploadDialog } from '@/components/portal/deliverable-upload-dialog';
import { MessageThread } from '@/components/portal/message-thread';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  completed_at: string | null;
  position: number;
}

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  status: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  feedback: string | null;
  created_at: string;
  uploaded_by_profile?: { id: string; full_name: string | null; avatar_url: string | null } | null;
}

interface PortalProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  milestones: Milestone[];
  deliverables: Deliverable[];
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default function PortalProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = React.useState<PortalProjectDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [milestoneDialogOpen, setMilestoneDialogOpen] = React.useState(false);
  const [editMilestone, setEditMilestone] = React.useState<Milestone | null>(null);
  const [deliverableDialogOpen, setDeliverableDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadProject = React.useCallback(() => {
    if (!id) return;
    apiGet<PortalProjectDetail>(`/api/portal/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    loadProject();
  }, [loadProject]);

  function handleRefresh() {
    loadProject();
    setRefreshKey((k) => k + 1);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>Project not found</p>
        <Link href="/portal/projects" className="mt-2 text-primary text-sm">Back to projects</Link>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.description ?? 'Manage milestones, deliverables, and communication'}
      >
        <div className="flex gap-2">
          <Link href="/portal/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Milestones</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditMilestone(null); setMilestoneDialogOpen(true); }}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Milestone
              </Button>
            </CardHeader>
            <CardContent>
              <MilestoneList
                projectId={id}
                milestones={project.milestones}
                onEdit={(m) => { setEditMilestone(m); setMilestoneDialogOpen(true); }}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          {/* Deliverables */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Deliverables</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeliverableDialogOpen(true)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Upload
              </Button>
            </CardHeader>
            <CardContent>
              <DeliverableList
                projectId={id}
                deliverables={project.deliverables}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          {/* Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <MessageThread projectId={id} refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={statusConfig.class}>{statusConfig.label}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{project.progress}%</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Timeline</p>
                <p className="text-sm">
                  {project.start_date && project.end_date
                    ? `${new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                    : 'Not set'}
                </p>
              </div>
              {project.budget != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Budget</p>
                  <p className="text-sm font-medium">${project.budget.toLocaleString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <MilestoneDialog
        open={milestoneDialogOpen}
        onOpenChange={setMilestoneDialogOpen}
        projectId={id}
        milestone={editMilestone}
        onSuccess={handleRefresh}
      />

      <DeliverableUploadDialog
        open={deliverableDialogOpen}
        onOpenChange={setDeliverableDialogOpen}
        projectId={id}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
