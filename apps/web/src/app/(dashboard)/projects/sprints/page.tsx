'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, CcdSpinner } from '@ccd/ui';
import { Plus, Zap, Play, CheckCircle, Pencil, Trash2 } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { SprintDialog } from '@/components/projects/sprint-dialog';
import { BacklogList } from '@/components/projects/backlog-list';

interface ProjectOption {
  id: string;
  name: string;
}

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  capacity_points: number | null;
  task_count?: number;
  completed_task_count?: number;
  total_points?: number;
  completed_points?: number;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string }> = {
  planning: { label: 'Planning', badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  active: { label: 'Active', badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
};

export default function SprintsPage() {
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = React.useState('');
  const [sprints, setSprints] = React.useState<Sprint[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [loadingSprints, setLoadingSprints] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editSprint, setEditSprint] = React.useState<Sprint | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  // Load projects
  React.useEffect(() => {
    apiGet<ProjectOption[]>('/api/projects?limit=100&status=active')
      .then((res) => {
        const data = res.data ?? [];
        setProjects(data);
        if (data.length > 0) setSelectedProject(data[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, []);

  // Load sprints when project changes
  React.useEffect(() => {
    if (!selectedProject) return;
    setLoadingSprints(true);
    apiGet<Sprint[]>(`/api/projects/${selectedProject}/sprints`)
      .then((res) => setSprints(res.data ?? []))
      .catch(() => setSprints([]))
      .finally(() => setLoadingSprints(false));
  }, [selectedProject, refreshKey]);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  async function handleStatusChange(sprintId: string, newStatus: string) {
    try {
      await apiPatch(`/api/projects/${selectedProject}/sprints/${sprintId}`, { status: newStatus });
      handleRefresh();
    } catch {
      // ignore
    }
  }

  async function handleDelete(sprintId: string) {
    try {
      await apiDelete(`/api/projects/${selectedProject}/sprints/${sprintId}`);
      handleRefresh();
    } catch {
      // ignore
    }
  }

  if (loadingProjects) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Sprints" description="Manage agile sprints and iterations" />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Zap className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No active projects</h3>
            <p className="text-sm text-muted-foreground">Create a project first to manage sprints.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSprint = sprints.find((s) => s.status === 'active');

  return (
    <div className="space-y-6">
      <PageHeader title="Sprints" description="Manage agile sprints and iterations">
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <Button onClick={() => { setEditSprint(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Sprint
          </Button>
        </div>
      </PageHeader>

      {selectedProject && (
        <>
          {/* Active Sprint */}
          {activeSprint && (
            <Card className="border-green-200 dark:border-green-800/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    {activeSprint.name}
                    <Badge className={STATUS_CONFIG.active.badge}>Active</Badge>
                  </CardTitle>
                  {activeSprint.goal && (
                    <p className="text-sm text-muted-foreground mt-1">{activeSprint.goal}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setEditSprint(activeSprint); setDialogOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(activeSprint.id, 'completed')}>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Complete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Tasks</p>
                    <p className="text-lg font-bold">{activeSprint.completed_task_count ?? 0}/{activeSprint.task_count ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="text-lg font-bold">{activeSprint.completed_points ?? 0}/{activeSprint.total_points ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Timeline</p>
                    <p className="text-sm">
                      {activeSprint.start_date && activeSprint.end_date
                        ? `${new Date(activeSprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${new Date(activeSprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{
                            width: `${(activeSprint.total_points ?? 0) > 0
                              ? Math.round(((activeSprint.completed_points ?? 0) / (activeSprint.total_points ?? 1)) * 100)
                              : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sprint List */}
          {loadingSprints ? (
            <div className="flex items-center justify-center py-8">
              <CcdSpinner size="lg" />
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">All Sprints</CardTitle>
              </CardHeader>
              <CardContent>
                {sprints.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No sprints yet. Create a sprint to start planning.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sprints.map((sprint) => {
                      const config = STATUS_CONFIG[sprint.status] ?? STATUS_CONFIG.planning;
                      return (
                        <div key={sprint.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50 group">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{sprint.name}</p>
                              <Badge className={`text-xs ${config.badge}`}>{config.label}</Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                              <span>{sprint.task_count ?? 0} tasks</span>
                              <span>{sprint.total_points ?? 0} points</span>
                              {sprint.start_date && (
                                <span>
                                  {new Date(sprint.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {sprint.end_date && ` — ${new Date(sprint.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {sprint.status === 'planning' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(sprint.id, 'active')}>
                                <Play className="mr-1 h-3 w-3" />
                                Start
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditSprint(sprint); setDialogOpen(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(sprint.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Backlog */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Backlog</CardTitle>
            </CardHeader>
            <CardContent>
              <BacklogList
                projectId={selectedProject}
                sprints={sprints}
                refreshKey={refreshKey}
                onRefresh={handleRefresh}
              />
            </CardContent>
          </Card>

          <SprintDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            projectId={selectedProject}
            sprint={editSprint}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
}
