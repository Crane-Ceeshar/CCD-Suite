'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  DataTable,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
  toast,
  type Column,
} from '@ccd/ui';
import { Plus, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { AuditScoreGauge } from '@/components/seo/audit-score-gauge';
import type { SeoAudit, SeoProject } from '@ccd/shared/types/seo';

type AuditRow = SeoAudit & { project_name?: string } & Record<string, unknown>;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  running: { label: 'Running', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function SEOAuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [running, setRunning] = useState(false);

  const fetchAudits = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiGet<SeoAudit[]>('/api/seo/audits'),
      apiGet<SeoProject[]>('/api/seo/projects'),
    ])
      .then(([auditsRes, projectsRes]) => {
        const projectMap = new Map(projectsRes.data.map((p) => [p.id, p.name]));
        setAudits(
          auditsRes.data.map((a) => ({
            ...a,
            project_name: projectMap.get(a.project_id) ?? 'Unknown',
          })) as AuditRow[]
        );
        setProjects(projectsRes.data);
      })
      .catch((err) => {
        setAudits([]);
        setProjects([]);
        toast({ title: 'Failed to load audits', description: err.message, variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Find the domain for the selected project (used for UX messaging)
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  async function handleRunAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;
    setRunning(true);
    try {
      const res = await apiPost<SeoAudit>('/api/seo/audits', { project_id: selectedProjectId });
      setRunDialogOpen(false);
      setSelectedProjectId('');
      const score = res.data?.score;
      toast({
        title: score != null ? `Audit completed — Score: ${score}/100` : 'Audit completed',
        description: score != null
          ? `Found ${res.data.issues_count} issue${res.data.issues_count !== 1 ? 's' : ''} across ${res.data.pages_crawled} page${res.data.pages_crawled !== 1 ? 's' : ''}`
          : 'Site health audit has been run successfully.',
      });
      fetchAudits();
    } catch (err) {
      toast({
        title: 'Audit failed',
        description: err instanceof Error ? err.message : 'Failed to run audit',
        variant: 'destructive',
      });
    } finally {
      setRunning(false);
    }
  }

  async function handleDeleteAudit(id: string) {
    if (!confirm('Delete this audit?')) return;
    try {
      await apiDelete(`/api/seo/audits/${id}`);
      toast({ title: 'Audit deleted' });
      fetchAudits();
    } catch (err) {
      toast({
        title: 'Failed to delete audit',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  const columns: Column<AuditRow>[] = [
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      width: 80,
      render: (audit) =>
        audit.score != null ? (
          <AuditScoreGauge score={audit.score} size={40} />
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      key: 'project_name',
      header: 'Project',
      sortable: true,
      render: (audit) => (
        <span className="font-medium">{audit.project_name}</span>
      ),
    },
    {
      key: 'started_at',
      header: 'Date',
      sortable: true,
      render: (audit) => (
        <span className="text-sm">
          {new Date(audit.started_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'pages_crawled',
      header: 'Pages',
      sortable: true,
      render: (audit) => (
        <span className="font-mono text-sm">{audit.pages_crawled}</span>
      ),
    },
    {
      key: 'issues_count',
      header: 'Issues',
      sortable: true,
      render: (audit) => (
        <span className={`font-mono text-sm ${audit.issues_count > 20 ? 'text-red-600' : audit.issues_count > 10 ? 'text-yellow-600' : 'text-green-600'}`}>
          {audit.issues_count}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (audit) => {
        const config = statusConfig[audit.status];
        return <Badge variant={config?.variant}>{config?.label ?? audit.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[60px]',
      render: (audit) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAudit(audit.id);
          }}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Audits"
        description={`View audit results and site health scores${audits.length > 0 ? ` · ${audits.length} audit${audits.length !== 1 ? 's' : ''}` : ''}`}
        actions={
          <Button onClick={() => setRunDialogOpen(true)} disabled={projects.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Run Audit
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Shield className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      ) : audits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No audits yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run an audit from your SEO project to check site health
            </p>
            <Button onClick={() => setRunDialogOpen(true)} disabled={projects.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Run Audit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          data={audits}
          keyExtractor={(a) => a.id}
          onRowClick={(a) => router.push(`/seo/audits/${a.id}`)}
          emptyMessage="No audits found"
          loading={loading}
        />
      )}

      <Dialog open={runDialogOpen} onOpenChange={(v) => { if (!running) setRunDialogOpen(v); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Run SEO Audit</DialogTitle>
            <DialogDescription>
              {running && selectedProject
                ? `Analyzing ${selectedProject.domain}... This may take up to 30 seconds.`
                : 'Select a project to run a live site health audit using Google PageSpeed Insights and HTML analysis.'}
            </DialogDescription>
          </DialogHeader>
          {running ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CcdSpinner size="lg" />
              <p className="text-sm text-muted-foreground text-center">
                Running Lighthouse analysis, crawling meta tags, checking technical SEO...
              </p>
            </div>
          ) : (
            <form onSubmit={handleRunAudit} className="space-y-4">
              <FormField label="Project" required>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.domain})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRunDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedProjectId}>
                  <Shield className="mr-2 h-4 w-4" />
                  Run Audit
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
