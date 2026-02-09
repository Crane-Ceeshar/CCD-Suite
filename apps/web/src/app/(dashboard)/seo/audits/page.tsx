'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  CcdLoader,
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
} from '@ccd/ui';
import { Plus, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { AuditScoreGauge } from '@/components/seo/audit-score-gauge';
import type { SeoAudit, SeoProject } from '@ccd/shared/types/seo';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  running: { label: 'Running', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function SEOAuditsPage() {
  const router = useRouter();
  const [audits, setAudits] = useState<SeoAudit[]>([]);
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [runDialogOpen, setRunDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [running, setRunning] = useState(false);

  const fetchAudits = useCallback(() => {
    setLoading(true);
    apiGet<SeoAudit[]>('/api/seo/audits')
      .then((res) => setAudits(res.data))
      .catch(() => setAudits([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAudits();
    apiGet<SeoProject[]>('/api/seo/projects')
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));
  }, [fetchAudits]);

  async function handleRunAudit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;
    setRunning(true);
    try {
      await apiPost('/api/seo/audits', { project_id: selectedProjectId });
      setRunDialogOpen(false);
      setSelectedProjectId('');
      fetchAudits();
    } catch {
      // Error handled silently
    } finally {
      setRunning(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="SEO Audits" description="View audit results and site health scores" />
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="SEO Audits" description="View audit results and site health scores">
        <Button onClick={() => setRunDialogOpen(true)} disabled={projects.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Run Audit
        </Button>
      </PageHeader>

      {audits.length === 0 ? (
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
        <div className="space-y-4">
          {audits.map((audit) => {
            const config = statusConfig[audit.status];
            return (
              <Card
                key={audit.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => router.push(`/seo/audits/${audit.id}`)}
              >
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    {audit.score != null && (
                      <AuditScoreGauge score={audit.score} size={60} />
                    )}
                    <div>
                      <p className="font-medium">
                        Audit {new Date(audit.started_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {audit.pages_crawled} pages crawled &middot; {audit.issues_count} issues found
                      </p>
                    </div>
                  </div>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Run SEO Audit</DialogTitle>
            <DialogDescription>
              Select a project to run a site health audit
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRunAudit} className="space-y-4">
            <FormField label="Project" required>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRunDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={running || !selectedProjectId}>
                {running && <CcdSpinner size="sm" className="mr-2" />}
                Run Audit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
