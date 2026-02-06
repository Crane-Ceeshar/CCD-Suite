'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, Globe } from 'lucide-react';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'outline' },
};

export default function SEOProjectsPage() {
  const [projects] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Projects"
        description="Manage your SEO projects and tracked domains"
      >
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </PageHeader>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No SEO projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a project to start tracking a domain
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const config = statusConfig[project.status];
            return (
              <Card key={project.id} className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.domain}</p>
                    </div>
                    <Badge variant={config?.variant}>{config?.label}</Badge>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
