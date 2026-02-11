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
import { apiPost, apiPatch, apiGet } from '@/lib/api';

interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  priority: string;
  start_date: string;
  due_date: string;
  budget: string;
  currency: string;
  color: string;
  client_id: string;
}

interface ClientOption {
  id: string;
  first_name: string;
  last_name: string;
  company?: { name: string } | null;
}

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    priority: string;
    start_date: string | null;
    due_date: string | null;
    budget: number | null;
    currency: string;
    color: string | null;
    client_id: string | null;
  } | null;
  onSuccess: () => void;
}

const initialForm: ProjectFormData = {
  name: '',
  description: '',
  status: 'active',
  priority: 'medium',
  start_date: '',
  due_date: '',
  budget: '',
  currency: 'USD',
  color: '#6366F1',
  client_id: '',
};

const COLOR_OPTIONS = [
  { value: '#6366F1', label: 'Indigo' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#F97316', label: 'Orange' },
  { value: '#EAB308', label: 'Yellow' },
  { value: '#22C55E', label: 'Green' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#64748B', label: 'Slate' },
];

export function ProjectDialog({ open, onOpenChange, project, onSuccess }: ProjectDialogProps) {
  const [form, setForm] = React.useState<ProjectFormData>(initialForm);
  const [clients, setClients] = React.useState<ClientOption[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!project;

  React.useEffect(() => {
    if (open) {
      if (project) {
        setForm({
          name: project.name,
          description: project.description ?? '',
          status: project.status,
          priority: project.priority,
          start_date: project.start_date ?? '',
          due_date: project.due_date ?? '',
          budget: project.budget != null ? String(project.budget) : '',
          currency: project.currency ?? 'USD',
          color: project.color ?? '#6366F1',
          client_id: project.client_id ?? '',
        });
      } else {
        setForm(initialForm);
      }
      setError('');
      apiGet<ClientOption[]>('/api/crm/contacts?limit=200')
        .then((res) => setClients(res.data))
        .catch(() => {});
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

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        start_date: form.start_date || null,
        due_date: form.due_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        currency: form.currency,
        color: form.color || null,
        client_id: form.client_id && form.client_id !== '__none' ? form.client_id : null,
      };

      if (isEdit) {
        await apiPatch(`/api/projects/${project!.id}`, payload);
      } else {
        await apiPost('/api/projects', payload);
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update project details' : 'Create a new project for your team'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Project Name" required>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Website Redesign"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Brief project description..."
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onValueChange={(v) => update('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </FormField>
            <FormField label="Due Date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => update('due_date', e.target.value)}
              />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Budget">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => update('budget', e.target.value)}
                placeholder="10000"
              />
            </FormField>
            <FormField label="Currency">
              <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Color">
            <div className="flex gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all ${
                    form.color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => update('color', c.value)}
                  title={c.label}
                />
              ))}
            </div>
          </FormField>
          <FormField label="Client (CRM Contact)">
            <Select value={form.client_id} onValueChange={(v) => update('client_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Link to client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                    {c.company ? ` — ${c.company.name}` : ''}
                  </SelectItem>
                ))}
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
