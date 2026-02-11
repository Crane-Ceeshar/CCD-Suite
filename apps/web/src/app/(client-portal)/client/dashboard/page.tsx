'use client';

import * as React from 'react';
import Link from 'next/link';
import { FolderOpen, FileCheck, Loader2 } from 'lucide-react';

interface DashboardProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  milestone_count: number;
  deliverable_count: number;
  message_count: number;
  pending_deliverables: number;
}

interface DashboardData {
  client_email: string;
  projects: DashboardProject[];
  stats: {
    total_projects: number;
    active_projects: number;
    pending_deliverables: number;
  };
}

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

export default function ClientDashboardPage() {
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetch('/api/client/dashboard')
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error?.message || 'Failed to load dashboard');
        setData(json.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-sm text-primary underline">
          Try again
        </button>
      </div>
    );
  }

  const projects = data?.projects ?? [];
  const stats = data?.stats ?? { total_projects: 0, active_projects: 0, pending_deliverables: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Signed in as <span className="font-medium">{data?.client_email}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            Projects
          </div>
          <p className="text-2xl font-bold mt-1">{stats.total_projects}</p>
          <p className="text-xs text-muted-foreground">{stats.active_projects} active</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileCheck className="h-4 w-4" />
            Pending Review
          </div>
          <p className="text-2xl font-bold mt-1">{stats.pending_deliverables}</p>
          <p className="text-xs text-muted-foreground">Deliverables awaiting review</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            Overall Progress
          </div>
          <p className="text-2xl font-bold mt-1">
            {projects.length > 0
              ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
              : 0}%
          </p>
          <p className="text-xs text-muted-foreground">Average across all projects</p>
        </div>
      </div>

      {/* Project list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No projects available yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.map((project) => {
              const config = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;
              return (
                <Link key={project.id} href={`/client/projects/${project.id}`}>
                  <div className="rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold truncate">{project.name}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.class}`}>
                            {config.label}
                          </span>
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{project.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{project.milestone_count} milestones</span>
                          <span>{project.deliverable_count} deliverables</span>
                          <span>{project.message_count} messages</span>
                        </div>
                      </div>
                      <div className="shrink-0 w-20 text-right">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{project.progress}%</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
