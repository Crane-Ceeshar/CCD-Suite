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
  Badge,
  CcdSpinner,
} from '@ccd/ui';
import { X } from 'lucide-react';
import { apiPost, apiPatch } from '@/lib/api';

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string;
  start_date: string;
  estimated_hours: string;
  assigned_to: string;
  labels: string[];
  story_points: string;
}

interface MemberOption {
  id: string;
  user_id: string;
  profile: { id: string; full_name: string; email: string } | null;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members: MemberOption[];
  task?: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    due_date: string | null;
    start_date: string | null;
    estimated_hours: number | null;
    assigned_to: string | null;
    labels: string[];
    story_points: number | null;
  } | null;
  defaultStatus?: string;
  onSuccess: () => void;
}

const initialForm: TaskFormData = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  start_date: '',
  estimated_hours: '',
  assigned_to: '',
  labels: [],
  story_points: '',
};

export function TaskDialog({ open, onOpenChange, projectId, members, task, defaultStatus, onSuccess }: TaskDialogProps) {
  const [form, setForm] = React.useState<TaskFormData>(initialForm);
  const [labelInput, setLabelInput] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!task;

  React.useEffect(() => {
    if (open) {
      if (task) {
        setForm({
          title: task.title,
          description: task.description ?? '',
          status: task.status,
          priority: task.priority,
          due_date: task.due_date ?? '',
          start_date: task.start_date ?? '',
          estimated_hours: task.estimated_hours != null ? String(task.estimated_hours) : '',
          assigned_to: task.assigned_to ?? '',
          labels: task.labels ?? [],
          story_points: task.story_points != null ? String(task.story_points) : '',
        });
      } else {
        setForm({ ...initialForm, status: defaultStatus ?? 'todo' });
      }
      setLabelInput('');
      setError('');
    }
  }, [open, task, defaultStatus]);

  function update(field: keyof TaskFormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function addLabel() {
    const label = labelInput.trim();
    if (label && !form.labels.includes(label)) {
      update('labels', [...form.labels, label]);
    }
    setLabelInput('');
  }

  function removeLabel(label: string) {
    update('labels', form.labels.filter((l) => l !== label));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        start_date: form.start_date || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        assigned_to: form.assigned_to && form.assigned_to !== '__none' ? form.assigned_to : null,
        labels: form.labels,
        story_points: form.story_points ? parseInt(form.story_points, 10) : null,
      };

      if (isEdit) {
        await apiPatch(`/api/projects/${projectId}/tasks/${task!.id}`, payload);
      } else {
        await apiPost(`/api/projects/${projectId}/tasks`, payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Task' : 'New Task'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update task details' : 'Add a new task to this project'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required>
            <Input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Implement login page"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Task description..."
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Status">
              <Select value={form.status} onValueChange={(v) => update('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Priority">
              <Select value={form.priority} onValueChange={(v) => update('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Assignee">
            <Select value={form.assigned_to} onValueChange={(v) => update('assigned_to', v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.profile?.full_name ?? m.profile?.email ?? 'Unknown'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input type="date" value={form.start_date} onChange={(e) => update('start_date', e.target.value)} />
            </FormField>
            <FormField label="Due Date">
              <Input type="date" value={form.due_date} onChange={(e) => update('due_date', e.target.value)} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Estimated Hours">
              <Input type="number" min="0" step="0.5" value={form.estimated_hours} onChange={(e) => update('estimated_hours', e.target.value)} placeholder="8" />
            </FormField>
            <FormField label="Story Points">
              <Input type="number" min="0" step="1" value={form.story_points} onChange={(e) => update('story_points', e.target.value)} placeholder="5" />
            </FormField>
          </div>
          <FormField label="Labels">
            <div className="space-y-2">
              <div className="flex gap-1 flex-wrap">
                {form.labels.map((label) => (
                  <Badge key={label} variant="secondary" className="gap-1">
                    {label}
                    <button type="button" onClick={() => removeLabel(label)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
                  placeholder="Add label..."
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={addLabel}>Add</Button>
              </div>
            </div>
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
