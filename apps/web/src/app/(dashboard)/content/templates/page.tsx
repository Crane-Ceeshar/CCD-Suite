'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  CcdLoader,
  EmptyState,
  toast,
} from '@ccd/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@ccd/ui';
import { Textarea } from '@ccd/ui';
import {
  Plus,
  LayoutTemplate,
  FileText,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import type { ContentTemplate, ContentType } from '@ccd/shared';

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: 'article', label: 'Article' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'email', label: 'Email' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'ad_copy', label: 'Ad Copy' },
  { value: 'video_script', label: 'Video Script' },
];

const EMPTY_FORM = {
  name: '',
  description: '',
  content_type: 'article' as ContentType,
  body_template: '',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = React.useState<ContentTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const fetchTemplates = React.useCallback(async () => {
    try {
      const res = await apiGet<ContentTemplate[]>('/api/content/templates');
      setTemplates(res.data);
    } catch {
      toast({ title: 'Failed to load templates', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(t: ContentTemplate) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description ?? '',
      content_type: t.content_type,
      body_template: t.body_template ?? '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiPatch(`/api/content/templates/${editingId}`, form);
        toast({ title: 'Template updated' });
      } else {
        await apiPost('/api/content/templates', form);
        toast({ title: 'Template created' });
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      await fetchTemplates();
    } catch (err) {
      toast({
        title: editingId ? 'Failed to update template' : 'Failed to create template',
        description: err instanceof Error ? err.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete template "${name}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/api/content/templates/${id}`);
      toast({ title: 'Template deleted' });
      await fetchTemplates();
    } catch {
      toast({ title: 'Failed to delete template', variant: 'destructive' });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Reusable content templates for faster creation"
        breadcrumbs={[
          { label: 'Content', href: '/content' },
          { label: 'Templates' },
        ]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-12 w-12" />}
          title="No templates yet"
          description="Create reusable templates for blog posts, social media, emails, and more."
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {t.is_system ? (
                      <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <CardTitle className="text-sm truncate">{t.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="outline" className="capitalize text-xs">
                      {t.content_type.replace(/_/g, ' ')}
                    </Badge>
                    {t.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        System
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pt-0">
                {t.description && (
                  <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                    {t.description}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      router.push(`/content/editor?template=${t.id}`)
                    }
                  >
                    <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" />
                    Use Template
                  </Button>
                  {!t.is_system && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(t.id, t.name)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ──────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your custom content template.'
                : 'Create a reusable template to speed up content creation.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Weekly Blog Post"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of this template"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Content Type</label>
              <Select
                value={form.content_type}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, content_type: v as ContentType }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Body Template</label>
              <Textarea
                placeholder="Write the default body content for this template..."
                rows={6}
                value={form.body_template}
                onChange={(e) =>
                  setForm((f) => ({ ...f, body_template: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Update Template'
                  : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
