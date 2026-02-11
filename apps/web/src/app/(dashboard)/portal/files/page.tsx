'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, CcdSpinner } from '@ccd/ui';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

interface PortalProject {
  id: string;
  name: string;
}

interface Deliverable {
  id: string;
  title: string;
  description: string | null;
  status: string;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
  portal_project_id: string;
}

const STATUS_BADGE: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  revision_requested: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  delivered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilesPage() {
  const [projects, setProjects] = React.useState<PortalProject[]>([]);
  const [deliverables, setDeliverables] = React.useState<Deliverable[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const projectsRes = await apiGet<PortalProject[]>('/api/portal/projects?limit=100');
        const projectList = projectsRes.data ?? [];
        setProjects(projectList);

        const allDeliverables: Deliverable[] = [];
        for (const p of projectList) {
          try {
            const res = await apiGet<Deliverable[]>(`/api/portal/projects/${p.id}/deliverables`);
            const items = (res.data ?? []).map((d) => ({ ...d, portal_project_id: p.id }));
            allDeliverables.push(...items);
          } catch {
            // ignore
          }
        }
        allDeliverables.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setDeliverables(allDeliverables);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

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
        title="Files"
        description="All deliverables across portal projects"
      />

      {deliverables.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No deliverables yet</h3>
            <p className="text-sm text-muted-foreground">Upload deliverables from within a portal project.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {deliverables.map((d) => {
            const badgeClass = STATUS_BADGE[d.status] ?? STATUS_BADGE.pending_review;
            return (
              <Link key={d.id} href={`/portal/projects/${d.portal_project_id}`}>
                <div className="flex items-center gap-3 py-3 px-4 rounded-lg border hover:bg-muted/30">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{projectMap.get(d.portal_project_id) ?? 'Unknown project'}</span>
                      {d.file_name && <span>{d.file_name}</span>}
                      {d.file_size && <span>{formatFileSize(d.file_size)}</span>}
                    </div>
                  </div>
                  <Badge className={`text-xs ${badgeClass}`}>{d.status.replace(/_/g, ' ')}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
