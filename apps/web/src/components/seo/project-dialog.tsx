'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
} from '@ccd/ui';
import { apiPost, apiPatch } from '@/lib/api';

interface ProjectFormData {
  name: string;
  domain: string;
  description: string;
  status: string;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: {
    id: string;
    name: string;
    domain: string;
    description: string | null;
    status: string;
  } | null;
  onSuccess: () => void;
}

const initialForm: ProjectFormData = {
  name: '',
  domain: '',
  description: '',
  status: 'active',
};

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
  const [form, setForm] = React.useState<ProjectFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!project;

  React.useEffect(() => {
    if (open) {
      if (project) {
        setForm({
          name: project.name,
          domain: project.domain,
          description: project.description ?? '',
          status: project.status,
        });
      } else {
        setForm(initialForm);
      }
      setError('');
    }
  }, [open, project]);

  function update(field: keyof ProjectFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!form.domain.trim()) {
      setError('Domain is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        domain: form.domain.trim(),
        description: form.description.trim() || null,
        status: form.status,
      };

      if (isEdit) {
        await apiPatch(`/api/seo/projects/${project!.id}`, payload);
      } else {
        await apiPost('/api/seo/projects', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New SEO Project'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update project details' : 'Create a new SEO project to track a domain'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Project Name" required>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="My Website SEO"
            />
          </FormField>
          <FormField label="Domain" required>
            <Input
              value={form.domain}
              onChange={(e) => update('domain', e.target.value)}
              placeholder="example.com"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Brief description of this SEO project..."
            />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
