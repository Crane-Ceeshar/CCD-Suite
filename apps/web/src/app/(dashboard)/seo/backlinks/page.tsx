'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdLoader,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FormField,
  CcdSpinner,
} from '@ccd/ui';
import { Link2, Plus, Search } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { BacklinksTable } from '@/components/seo/backlinks-table';
import type { Backlink } from '@ccd/shared/types/seo';

interface ProjectOption {
  id: string;
  name: string;
}

export default function BacklinksPage() {
  const [backlinks, setBacklinks] = React.useState<Backlink[]>([]);
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [projectFilter, setProjectFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const fetchBacklinks = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectFilter !== 'all') params.set('project_id', projectFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await apiGet<Backlink[]>(`/api/seo/backlinks?${params}`);
      setBacklinks(res.data);
    } catch {
      setBacklinks([]);
    } finally {
      setLoading(false);
    }
  }, [projectFilter, statusFilter, search]);

  React.useEffect(() => {
    fetchBacklinks();
    apiGet<ProjectOption[]>('/api/seo/projects?limit=200')
      .then((res) => setProjects(res.data))
      .catch(() => {});
  }, [fetchBacklinks]);

  async function handleDelete(id: string) {
    if (!confirm('Delete this backlink?')) return;
    try {
      await apiDelete(`/api/seo/backlinks/${id}`);
      fetchBacklinks();
    } catch {
      alert('Failed to delete backlink');
    }
  }

  // Stats
  const totalBacklinks = backlinks.length;
  const activeBacklinks = backlinks.filter((b) => b.status === 'active').length;
  const avgDA =
    backlinks.length > 0
      ? Math.round(
          backlinks.reduce((sum, b) => sum + (b.domain_authority ?? 0), 0) /
            backlinks.filter((b) => b.domain_authority != null).length || 0
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Backlinks</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage your backlink profile
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Backlink
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Backlinks</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBacklinks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Link2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBacklinks.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Domain Authority</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDA}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by URL or anchor text..."
            className="pl-9"
          />
        </div>
        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <BacklinksTable
            backlinks={backlinks}
            loading={loading}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Add Backlink Dialog */}
      <AddBacklinkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projects={projects}
        onSuccess={fetchBacklinks}
      />
    </div>
  );
}

// --- Add Backlink Dialog ---

interface AddBacklinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: ProjectOption[];
  onSuccess: () => void;
}

function AddBacklinkDialog({ open, onOpenChange, projects, onSuccess }: AddBacklinkDialogProps) {
  const [form, setForm] = React.useState({
    project_id: '',
    source_url: '',
    target_url: '',
    anchor_text: '',
    domain_authority: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setForm({ project_id: '', source_url: '', target_url: '', anchor_text: '', domain_authority: '' });
      setError('');
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.project_id || !form.source_url.trim() || !form.target_url.trim()) {
      setError('Project, source URL, and target URL are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost('/api/seo/backlinks', {
        project_id: form.project_id,
        source_url: form.source_url.trim(),
        target_url: form.target_url.trim(),
        anchor_text: form.anchor_text.trim() || null,
        domain_authority: form.domain_authority ? parseInt(form.domain_authority) : null,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add backlink');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Backlink</DialogTitle>
          <DialogDescription>Manually add a backlink to track</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Project" required>
            <Select value={form.project_id} onValueChange={(v) => setForm((p) => ({ ...p, project_id: v }))}>
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
          <FormField label="Source URL" required>
            <Input
              value={form.source_url}
              onChange={(e) => setForm((p) => ({ ...p, source_url: e.target.value }))}
              placeholder="https://referring-site.com/page"
            />
          </FormField>
          <FormField label="Target URL" required>
            <Input
              value={form.target_url}
              onChange={(e) => setForm((p) => ({ ...p, target_url: e.target.value }))}
              placeholder="https://yoursite.com/page"
            />
          </FormField>
          <FormField label="Anchor Text">
            <Input
              value={form.anchor_text}
              onChange={(e) => setForm((p) => ({ ...p, anchor_text: e.target.value }))}
              placeholder="Click here"
            />
          </FormField>
          <FormField label="Domain Authority (0-100)">
            <Input
              type="number"
              min="0"
              max="100"
              value={form.domain_authority}
              onChange={(e) => setForm((p) => ({ ...p, domain_authority: e.target.value }))}
              placeholder="45"
            />
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Add Backlink
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
