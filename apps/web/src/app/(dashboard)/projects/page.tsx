'use client';

import * as React from 'react';
import { PageHeader, StatCard, Button, CcdSpinner } from '@ccd/ui';
import { FolderKanban, CheckCircle, Clock, AlertTriangle, Plus } from 'lucide-react';
import { useProjects, useProjectStats } from '@/hooks/use-projects';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectDialog } from '@/components/projects/project-dialog';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface ProjectStats {
  active_projects: number;
  open_tasks: number;
  hours_tracked: number;
  overdue_tasks: number;
}

export default function ProjectsDashboardPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editProject, setEditProject] = React.useState<null | Record<string, unknown>>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: statsRaw, isLoading: statsLoading } = useProjectStats();
  const { data: projectsRaw, isLoading: projectsLoading } = useProjects({ limit: 12, sort: 'updated_at', dir: 'desc' });

  const stats = (statsRaw as { data?: ProjectStats } | undefined)?.data;
  const projects = ((projectsRaw as { data?: Record<string, unknown>[] } | undefined)?.data) ?? [];

  function handleProjectSuccess() {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Task management, workflows, and team coordination"
        actions={
          <Button onClick={() => { setEditProject(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Projects"
          value={statsLoading ? '—' : String(stats?.active_projects ?? 0)}
          icon={<FolderKanban className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#6366F1"
        />
        <StatCard
          label="Open Tasks"
          value={statsLoading ? '—' : String(stats?.open_tasks ?? 0)}
          icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#6366F1"
        />
        <StatCard
          label="Hours Tracked"
          value={statsLoading ? '—' : `${stats?.hours_tracked ?? 0}h`}
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#6366F1"
        />
        <StatCard
          label="Overdue"
          value={statsLoading ? '—' : String(stats?.overdue_tasks ?? 0)}
          icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#6366F1"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Recent Projects</h2>
        {projectsLoading ? (
          <div className="flex items-center justify-center py-12">
            <CcdSpinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderKanban className="h-10 w-10 mb-2" />
            <p className="text-sm">No projects yet. Create your first project to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project: Record<string, unknown>) => (
              <ProjectCard
                key={project.id as string}
                project={project as ProjectCardProject}
                onClick={() => router.push(`/projects/board?project=${project.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editProject as ProjectDialogProject | null}
        onSuccess={handleProjectSuccess}
      />
    </div>
  );
}

type ProjectCardProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  color: string | null;
  due_date: string | null;
  task_count?: number;
  completed_task_count?: number;
  members?: { id: string; profile?: { full_name: string; avatar_url: string | null } | null }[];
};

type ProjectDialogProject = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  budget: number | null;
  currency: string;
  color: string | null;
  client_id: string | null;
};
