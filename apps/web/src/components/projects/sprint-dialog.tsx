'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, CcdSpinner,
} from '@ccd/ui';
import { apiPost, apiPatch } from '@/lib/api';

interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  capacity_points: number | null;
}

interface SprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  sprint?: Sprint | null;
  onSuccess?: () => void;
}

export function SprintDialog({ open, onOpenChange, projectId, sprint, onSuccess }: SprintDialogProps) {
  const isEdit = !!sprint;
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const [formData, setFormData] = React.useState({
    name: '',
    goal: '',
    start_date: '',
    end_date: '',
    capacity_points: '',
  });

  React.useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        goal: sprint.goal ?? '',
        start_date: sprint.start_date ?? '',
        end_date: sprint.end_date ?? '',
        capacity_points: sprint.capacity_points?.toString() ?? '',
      });
    } else {
      // Default: 2-week sprint starting today
      const today = new Date();
      const twoWeeks = new Date(today);
      twoWeeks.setDate(today.getDate() + 14);
      setFormData({
        name: '',
        goal: '',
        start_date: today.toISOString().slice(0, 10),
        end_date: twoWeeks.toISOString().slice(0, 10),
        capacity_points: '',
      });
    }
    setError('');
  }, [sprint, open]);

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSave() {
    if (!formData.name.trim()) {
      setError('Sprint name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: formData.name.trim(),
        goal: formData.goal.trim() || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        capacity_points: formData.capacity_points ? parseInt(formData.capacity_points, 10) : null,
      };

      if (isEdit) {
        await apiPatch(`/api/projects/${projectId}/sprints/${sprint!.id}`, payload);
      } else {
        await apiPost(`/api/projects/${projectId}/sprints`, payload);
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sprint');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sprint' : 'New Sprint'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="sprint-name">Sprint Name</Label>
            <Input
              id="sprint-name"
              value={formData.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Sprint 1"
            />
          </div>
          <div>
            <Label htmlFor="sprint-goal">Goal</Label>
            <textarea
              id="sprint-goal"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What do we want to achieve this sprint?"
              value={formData.goal}
              onChange={(e) => update('goal', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sprint-start">Start Date</Label>
              <Input
                id="sprint-start"
                type="date"
                value={formData.start_date}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="sprint-end">End Date</Label>
              <Input
                id="sprint-end"
                type="date"
                value={formData.end_date}
                onChange={(e) => update('end_date', e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sprint-capacity">Capacity (Story Points)</Label>
            <Input
              id="sprint-capacity"
              type="number"
              min="0"
              value={formData.capacity_points}
              onChange={(e) => update('capacity_points', e.target.value)}
              placeholder="e.g. 40"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            {isEdit ? 'Update' : 'Create Sprint'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
