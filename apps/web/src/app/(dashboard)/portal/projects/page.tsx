'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, Badge, Button, CcdSpinner } from '@ccd/ui';
import { Plus, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  active: { label: 'Active', class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  completed: { label: 'Completed', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  on_hold: { label: 'On Hold', class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
};

interface PortalProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  milestone_count?: number;
  deliverable_count?: number;
}

export default function PortalProjectsPage() {
  const [projects, setProjects] = React.useState<PortalProject[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiGet<PortalProject[]>('/api/portal/projects?limit=100')
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Portal Projects"
        description="Manage client-facing projects"
      >
        <Link href="/portal/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </PageHeader>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No portal projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a project to share progress with your clients
            </p>
            <Link href="/portal/projects/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const config = STATUS_CONFIG[project.status] ?? STATUS_CONFIG.active;
            return (
              <Link key={project.id} href={`/portal/projects/${project.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge className={config.class}>{config.label}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-500 rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {(project.milestone_count ?? 0) > 0 && (
                        <span>{project.milestone_count} milestone{project.milestone_count === 1 ? '' : 's'}</span>
                      )}
                      {(project.deliverable_count ?? 0) > 0 && (
                        <span>{project.deliverable_count} deliverable{project.deliverable_count === 1 ? '' : 's'}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
