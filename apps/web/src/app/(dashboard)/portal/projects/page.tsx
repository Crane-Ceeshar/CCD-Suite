'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, FolderOpen } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  completed: { label: 'Completed', variant: 'secondary' },
  on_hold: { label: 'On Hold', variant: 'outline' },
};

export default function PortalProjectsPage() {
  const [projects] = useState<any[]>([]);

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
            const config = statusConfig[project.status];
            return (
              <Link key={project.id} href={`/portal/projects/${project.id}`}>
                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium">{project.name}</h3>
                      <Badge variant={config?.variant}>{config?.label}</Badge>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    {/* Progress bar */}
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
