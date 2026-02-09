'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  Input,
  DataTable,
  toast,
  type Column,
} from '@ccd/ui';
import { Plus, Globe, Search, LayoutGrid, List, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { ProjectDialog } from '@/components/seo/project-dialog';
import type { SeoProject } from '@ccd/shared/types/seo';

type ProjectRow = SeoProject & Record<string, unknown>;

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'outline' },
};

export default function SEOProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProject, setEditProject] = useState<SeoProject | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const fetchProjects = useCallback(() => {
    setLoading(true);
    apiGet<SeoProject[]>('/api/seo/projects')
      .then((res) => setProjects(res.data))
      .catch((err) => {
        setProjects([]);
        toast({ title: 'Failed to load projects', description: err.message, variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
    );
  }, [projects, search]);

  function handleCreate() {
    setEditProject(null);
    setDialogOpen(true);
  }

  function handleEdit(project: SeoProject) {
    setEditProject(project);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await apiDelete(`/api/seo/projects/${id}`);
      toast({ title: 'Project deleted' });
      fetchProjects();
    } catch (err) {
      toast({ title: 'Failed to delete', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
  }

  async function handleCellEdit(item: ProjectRow, key: string, value: unknown) {
    const original = projects.find((p) => p.id === item.id);
    setProjects((prev) => prev.map((p) => (p.id === item.id ? { ...p, [key]: value } : p)));
    try {
      await apiPatch(`/api/seo/projects/${item.id}`, { [key]: value });
      toast({ title: 'Project updated' });
    } catch {
      if (original) setProjects((prev) => prev.map((p) => (p.id === item.id ? original : p)));
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  }

  const columns: Column<ProjectRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      editable: true,
      width: 200,
      render: (project) => (
        <span className="font-medium">{project.name}</span>
      ),
    },
    {
      key: 'domain',
      header: 'Domain',
      sortable: true,
      editable: true,
      render: (project) => (
        <span className="text-muted-foreground">{project.domain}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'select',
      editOptions: [
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'completed', label: 'Completed' },
      ],
      render: (project) => {
        const config = statusConfig[project.status];
        return <Badge variant={config?.variant}>{config?.label ?? project.status}</Badge>;
      },
    },
    {
      key: 'description',
      header: 'Description',
      editable: true,
      render: (project) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
          {project.description || '-'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (project) => (
        <span className="text-sm text-muted-foreground">
          {new Date(project.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px]',
      render: (project) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(project as SeoProject);
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(project.id);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Projects"
        description={`Manage your SEO projects and tracked domains${projects.length > 0 ? ` · ${projects.length} project${projects.length !== 1 ? 's' : ''}` : ''}`}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        }
      />

      {projects.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Globe className="h-8 w-8 animate-pulse text-muted-foreground" />
        </div>
      ) : filtered.length === 0 && projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No SEO projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a project to start tracking a domain
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={filtered as ProjectRow[]}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => router.push(`/seo/projects/${p.id}`)}
          onCellEdit={handleCellEdit}
          emptyMessage={search ? 'No projects match your search' : 'No projects found'}
          loading={loading}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => {
            const config = statusConfig[project.status];
            return (
              <div key={project.id} className="relative group">
                <Card
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/seo/projects/${project.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">{project.domain}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={config?.variant}>{config?.label}</Badge>
                      </div>
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                  </CardContent>
                </Card>
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(project);
                    }}
                    title="Edit project"
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(project.id);
                    }}
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editProject}
        onSuccess={fetchProjects}
      />
    </div>
  );
}
