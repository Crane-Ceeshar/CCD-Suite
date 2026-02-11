'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, CcdSpinner,
} from '@ccd/ui';
import { apiPost } from '@/lib/api';

interface DeliverableUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function DeliverableUploadDialog({ open, onOpenChange, projectId, onSuccess }: DeliverableUploadDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    file_name: '',
    file_url: '',
  });

  React.useEffect(() => {
    if (open) {
      setFormData({ title: '', description: '', file_name: '', file_url: '' });
      setError('');
    }
  }, [open]);

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSave() {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost(`/api/portal/projects/${projectId}/deliverables`, {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        file_name: formData.file_name.trim() || null,
        file_url: formData.file_url.trim() || null,
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deliverable');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Deliverable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="del-title">Title</Label>
            <Input
              id="del-title"
              value={formData.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Logo Design v2"
            />
          </div>

          <div>
            <Label htmlFor="del-description">Description</Label>
            <textarea
              id="del-description"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe this deliverable..."
              value={formData.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="del-filename">File Name</Label>
            <Input
              id="del-filename"
              value={formData.file_name}
              onChange={(e) => update('file_name', e.target.value)}
              placeholder="logo-v2.png"
            />
          </div>

          <div>
            <Label htmlFor="del-url">File URL (optional)</Label>
            <Input
              id="del-url"
              value={formData.file_url}
              onChange={(e) => update('file_url', e.target.value)}
              placeholder="https://..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste a link to the file in your cloud storage.
            </p>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            Add Deliverable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
