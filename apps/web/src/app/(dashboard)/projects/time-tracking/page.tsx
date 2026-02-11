'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, CcdSpinner } from '@ccd/ui';
import { Plus, Clock } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { TimerWidget } from '@/components/projects/timer-widget';
import { TimeEntryList } from '@/components/projects/time-entry-list';
import { TimeEntryDialog } from '@/components/projects/time-entry-dialog';
import { TimesheetGrid } from '@/components/projects/timesheet-grid';

interface ProjectOption {
  id: string;
  name: string;
}

export default function TimeTrackingPage() {
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = React.useState('');
  const [loadingProjects, setLoadingProjects] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editEntry, setEditEntry] = React.useState<null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

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

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
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
        <PageHeader
          title="Time Tracking"
          description="Track time spent on tasks and projects"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No active projects</h3>
            <p className="text-sm text-muted-foreground">Create a project first to start tracking time.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Tracking"
        description="Track time spent on tasks and projects"
      >
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
          <Button onClick={() => { setEditEntry(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Log Time
          </Button>
        </div>
      </PageHeader>

      {selectedProject && (
        <>
          {/* Timer */}
          <TimerWidget projectId={selectedProject} onTimerChange={handleRefresh} />

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent entries */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Time Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <TimeEntryList
                    projectId={selectedProject}
                    refreshKey={refreshKey}
                    onEdit={() => {
                      setDialogOpen(true);
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">This Week</CardTitle>
                </CardHeader>
                <CardContent>
                  <WeekSummary projectId={selectedProject} refreshKey={refreshKey} />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Timesheet */}
          <TimesheetGrid projectId={selectedProject} refreshKey={refreshKey} />

          <TimeEntryDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            projectId={selectedProject}
            entry={editEntry}
            onSuccess={handleRefresh}
          />
        </>
      )}
    </div>
  );
}

// Quick weekly summary widget
function WeekSummary({ projectId, refreshKey }: { projectId: string; refreshKey: number }) {
  const [data, setData] = React.useState<{ total_minutes: number; billable_minutes: number; total_cost: number } | null>(null);

  React.useEffect(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const from = monday.toISOString().slice(0, 10);
    const to = sunday.toISOString().slice(0, 10);

    apiGet<{ total_minutes: number; billable_minutes: number; total_cost: number }>(
      `/api/projects/${projectId}/timesheet?from=${from}&to=${to}&group_by=date`
    )
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, [projectId, refreshKey]);

  if (!data) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const totalHours = Math.round((data.total_minutes / 60) * 10) / 10;
  const billableHours = Math.round((data.billable_minutes / 60) * 10) / 10;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-muted-foreground">Total Hours</p>
        <p className="text-2xl font-bold">{totalHours}h</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Billable Hours</p>
        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{billableHours}h</p>
      </div>
      {data.total_cost > 0 && (
        <div>
          <p className="text-xs text-muted-foreground">Revenue</p>
          <p className="text-lg font-semibold">${data.total_cost.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
