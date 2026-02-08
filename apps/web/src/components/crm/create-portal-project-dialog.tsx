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
  CcdSpinner,
} from '@ccd/ui';
import { toast } from '@ccd/ui';
import { FolderPlus } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface CreatePortalProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  contactEmail: string | null;
  companyId?: string | null;
  dealTitle?: string;
  onSuccess?: (projectId: string) => void;
}

export function CreatePortalProjectDialog({
  open,
  onOpenChange,
  contactId,
  contactName,
  contactEmail,
  dealTitle,
  onSuccess,
}: CreatePortalProjectDialogProps) {
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [sendInvite, setSendInvite] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setName(dealTitle ? `Project - ${dealTitle}` : `Portal - ${contactName}`);
      setDescription('');
      setSendInvite(!!contactEmail);
      setError('');
    }
  }, [open, contactName, contactEmail, dealTitle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Create portal project and send invite in one call
      const res = await apiPost<{ portal_project_id: string; invitation_sent: boolean }>(
        '/api/portal/invite',
        {
          contact_id: contactId,
        }
      );

      toast({
        title: 'Portal project created',
        description: sendInvite
          ? `Invitation sent to ${contactEmail}`
          : 'Project created without invitation',
      });

      onOpenChange(false);
      onSuccess?.(res.data.portal_project_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create portal project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            Create Portal Project
          </DialogTitle>
          <DialogDescription>
            Create a client portal project for {contactName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Project Name" required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="Brief description of the project..."
            />
          </FormField>

          {contactEmail && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="rounded border-input"
              />
              Send portal invitation to {contactEmail}
            </label>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
