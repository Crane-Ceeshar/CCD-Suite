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

interface MilestoneFormData {
  title: string;
  description: string;
  due_date: string;
  status: string;
}

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestone?: {
    id: string;
    title: string;
    description: string | null;
    due_date: string | null;
    status: string;
  } | null;
  onSuccess: () => void;
}

const initialForm: MilestoneFormData = {
  title: '',
  description: '',
  due_date: '',
  status: 'upcoming',
};

export function MilestoneDialog({ open, onOpenChange, projectId, milestone, onSuccess }: MilestoneDialogProps) {
  const [form, setForm] = React.useState<MilestoneFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!milestone;

  React.useEffect(() => {
    if (open) {
      if (milestone) {
        setForm({
          title: milestone.title,
          description: milestone.description ?? '',
          due_date: milestone.due_date ?? '',
          status: milestone.status,
        });
      } else {
        setForm(initialForm);
      }
      setError('');
    }
  }, [open, milestone]);

  function update(field: keyof MilestoneFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        status: form.status,
      };

      if (isEdit) {
        await apiPatch(`/api/portal/projects/${projectId}/milestones/${milestone!.id}`, payload);
      } else {
        await apiPost(`/api/portal/projects/${projectId}/milestones`, payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save milestone');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update milestone details' : 'Add a new milestone to track project progress'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Design phase complete"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Milestone description..."
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Due Date">
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => update('due_date', e.target.value)}
              />
            </FormField>
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
