'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, CcdSpinner,
} from '@ccd/ui';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface Task {
  id: string;
  title: string;
}

interface TimeEntry {
  id: string;
  task_id: string;
  description: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  billable: boolean;
  hourly_rate: number | null;
}

interface TimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  entry?: TimeEntry | null;
  onSuccess?: () => void;
}

export function TimeEntryDialog({ open, onOpenChange, projectId, entry, onSuccess }: TimeEntryDialogProps) {
  const isEdit = !!entry;
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    task_id: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
    start_time: '09:00',
    end_time: '10:00',
    billable: true,
    hourly_rate: '',
  });

  // Load tasks
  React.useEffect(() => {
    if (!open) return;
    apiGet<Task[]>(`/api/projects/${projectId}/tasks?limit=200`)
      .then((res) => setTasks(res.data ?? []))
      .catch(() => {});
  }, [open, projectId]);

  // Populate form for editing
  React.useEffect(() => {
    if (entry) {
      const startDate = new Date(entry.started_at);
      const endDate = entry.ended_at ? new Date(entry.ended_at) : null;
      setFormData({
        task_id: entry.task_id,
        description: entry.description ?? '',
        date: startDate.toISOString().slice(0, 10),
        start_time: startDate.toTimeString().slice(0, 5),
        end_time: endDate ? endDate.toTimeString().slice(0, 5) : '',
        billable: entry.billable,
        hourly_rate: entry.hourly_rate?.toString() ?? '',
      });
    } else {
      setFormData({
        task_id: '',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        start_time: '09:00',
        end_time: '10:00',
        billable: true,
        hourly_rate: '',
      });
    }
    setError('');
  }, [entry, open]);

  const update = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSave() {
    if (!isEdit && !formData.task_id) {
      setError('Please select a task');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const startedAt = new Date(`${formData.date}T${formData.start_time}:00`).toISOString();
      const endedAt = formData.end_time
        ? new Date(`${formData.date}T${formData.end_time}:00`).toISOString()
        : null;

      if (isEdit) {
        await apiPatch(`/api/projects/${projectId}/time-entries/${entry!.id}`, {
          description: formData.description || null,
          ended_at: endedAt,
          billable: formData.billable,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        });
      } else {
        await apiPost(`/api/projects/${projectId}/time-entries`, {
          task_id: formData.task_id,
          description: formData.description || null,
          started_at: startedAt,
          ended_at: endedAt,
          is_running: false,
          billable: formData.billable,
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save time entry');
    } finally {
      setSaving(false);
    }
  }

  // Computed duration
  const computedDuration = React.useMemo(() => {
    if (!formData.start_time || !formData.end_time) return null;
    const start = new Date(`${formData.date}T${formData.start_time}:00`).getTime();
    const end = new Date(`${formData.date}T${formData.end_time}:00`).getTime();
    if (end <= start) return null;
    const mins = Math.round((end - start) / 60000);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  }, [formData.date, formData.start_time, formData.end_time]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Time Entry' : 'Log Time'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isEdit && (
            <div>
              <Label>Task</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={formData.task_id}
                onChange={(e) => update('task_id', e.target.value)}
              >
                <option value="">Select a task...</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label htmlFor="te-description">Description</Label>
            <textarea
              id="te-description"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What did you work on?"
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="te-date">Date</Label>
            <Input
              id="te-date"
              type="date"
              value={formData.date}
              onChange={(e) => update('date', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="te-start">Start Time</Label>
              <Input
                id="te-start"
                type="time"
                value={formData.start_time}
                onChange={(e) => update('start_time', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="te-end">End Time</Label>
              <Input
                id="te-end"
                type="time"
                value={formData.end_time}
                onChange={(e) => update('end_time', e.target.value)}
              />
            </div>
          </div>

          {computedDuration && (
            <p className="text-sm text-muted-foreground">Duration: <span className="font-medium">{computedDuration}</span></p>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded"
                checked={formData.billable}
                onChange={(e) => update('billable', e.target.checked)}
              />
              Billable
            </label>
            {formData.billable && (
              <div className="flex items-center gap-1">
                <Label htmlFor="te-rate" className="text-xs">Rate</Label>
                <Input
                  id="te-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24 h-7 text-xs"
                  placeholder="$/hr"
                  value={formData.hourly_rate}
                  onChange={(e) => update('hourly_rate', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            {isEdit ? 'Update' : 'Log Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
