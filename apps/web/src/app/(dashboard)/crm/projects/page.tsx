'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  CcdSpinner,
} from '@ccd/ui';
import { Plus, ExternalLink, FolderKanban, CalendarDays, Milestone, FileBox } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PortalProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client_name: string | null;
  progress: number;
  milestone_count: number;
  deliverable_count: number;
  last_activity_at: string | null;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ClientProjectsPage() {
  const [projects, setProjects] = React.useState<PortalProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiGet<PortalProject[]>('/api/portal/projects')
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Projects"
        description="Manage active client engagements and deliverables"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Client Projects' },
        ]}
        actions={
          <Link href="/portal/projects/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Portal Project
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <CcdSpinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
          <FolderKanban className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            No portal projects yet
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
            Create your first portal project to track progress, milestones, and client communications in one place.
          </p>
          <Link href="/portal/projects/new">
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1" />
              Create Portal Project
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_140px_160px_80px_70px_80px_120px_40px] gap-2 px-4 py-2.5 border-b bg-muted/30 text-xs font-medium text-muted-foreground">
              <span>Project</span>
              <span>Client</span>
              <span>Progress</span>
              <span>Status</span>
              <span className="text-center">Miles.</span>
              <span className="text-center">Deliv.</span>
              <span>Last Activity</span>
              <span />
            </div>

            {/* Table rows */}
            <div className="divide-y">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/portal/projects/${project.id}`}
                  className="grid grid-cols-[1fr_140px_160px_80px_70px_80px_120px_40px] gap-2 px-4 py-3 items-center text-sm hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Name */}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {/* Client */}
                  <span className="text-xs text-muted-foreground truncate">
                    {project.client_name ?? '--'}
                  </span>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{project.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${project.progress}%`,
                          backgroundColor: '#6366F1',
                        }}
                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <Badge className={`text-[10px] justify-center ${STATUS_CLASSES[project.status] ?? ''}`}>
                    {formatStatus(project.status)}
                  </Badge>

                  {/* Milestone count */}
                  <span className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <Milestone className="h-3 w-3" />
                    {project.milestone_count}
                  </span>

                  {/* Deliverable count */}
                  <span className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                    <FileBox className="h-3 w-3" />
                    {project.deliverable_count}
                  </span>

                  {/* Last Activity */}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {formatDate(project.last_activity_at)}
                  </span>

                  {/* Link icon */}
                  <span className="flex items-center justify-center text-muted-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
