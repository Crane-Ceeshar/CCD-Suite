'use client';

import * as React from 'react';
import { PageHeader, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { TaskList } from '@/components/projects/task-list';
import { TaskDialog } from '@/components/projects/task-dialog';
import { apiGet } from '@/lib/api';

interface ProjectOption {
  id: string;
  name: string;
}

interface MemberOption {
  id: string;
  user_id: string;
  profile: { id: string; full_name: string; email: string } | null;
}

export default function TaskListPage() {
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = React.useState('');
  const [members, setMembers] = React.useState<MemberOption[]>([]);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    apiGet<ProjectOption[]>('/api/projects?limit=100&status=active')
      .then((res) => {
        setProjects(res.data);
        if (res.data.length > 0) setSelectedProject(res.data[0].id);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    if (selectedProject) {
      apiGet<MemberOption[]>(`/api/projects/${selectedProject}/members`)
        .then((res) => setMembers(res.data))
        .catch(() => setMembers([]));
    }
  }, [selectedProject]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Tasks"
        description="View and manage tasks across all projects"
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'Tasks' }]}
        actions={
          <div className="flex items-center gap-3">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setDialogOpen(true)} disabled={!selectedProject}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        }
      />
      <TaskList
        projectId={selectedProject || null}
        refreshKey={refreshKey}
      />
      {selectedProject && (
        <TaskDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projectId={selectedProject}
          members={members}
          onSuccess={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  );
}
