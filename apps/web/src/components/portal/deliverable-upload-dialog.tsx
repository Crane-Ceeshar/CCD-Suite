'use client';

import * as React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, CcdSpinner,
} from '@ccd/ui';
import { FileUpload } from '@/components/shared/file-upload';
import { apiPost } from '@/lib/api';
import { CheckCircle2, FileIcon, X } from 'lucide-react';

interface DeliverableUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

interface UploadedFile {
  path: string;
  url: string;
  name: string;
  size: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliverableUploadDialog({ open, onOpenChange, projectId, onSuccess }: DeliverableUploadDialogProps) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | null>(null);

  React.useEffect(() => {
    if (open) {
      setTitle('');
      setDescription('');
      setUploadedFile(null);
      setError('');
    }
  }, [open]);

  function handleUploadComplete(file: UploadedFile) {
    setUploadedFile(file);
    // Auto-fill title from file name if empty
    if (!title.trim()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(nameWithoutExt);
    }
    setError('');
  }

  function handleUploadError(errorMsg: string) {
    setError(errorMsg);
  }

  function handleRemoveFile() {
    setUploadedFile(null);
  }

  async function handleSave() {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!uploadedFile) {
      setError('Please upload a file first');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost(`/api/portal/projects/${projectId}/deliverables`, {
        title: title.trim(),
        description: description.trim() || null,
        file_name: uploadedFile.name,
        file_url: uploadedFile.path,
        file_size: uploadedFile.size,
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Deliverable</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File Upload Zone */}
          {!uploadedFile ? (
            <FileUpload
              bucket="project-files"
              maxSize={500 * 1024 * 1024}
              onUploadComplete={handleUploadComplete}
              onError={handleUploadError}
            />
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{uploadedFile.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatFileSize(uploadedFile.size)} — Uploaded successfully
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={handleRemoveFile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="del-title">Title</Label>
            <Input
              id="del-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Logo Design v2, Homepage Mockup"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="del-description">Description (optional)</Label>
            <textarea
              id="del-description"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Add notes about this deliverable..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !uploadedFile}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            Add Deliverable
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
