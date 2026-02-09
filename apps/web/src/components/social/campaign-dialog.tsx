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
import type { SocialCampaign } from '@ccd/shared/types/social';

interface CampaignFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  budget: string;
  status: string;
}

interface CampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign?: SocialCampaign | null;
  onSuccess: () => void;
}

const initialForm: CampaignFormData = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  budget: '',
  status: 'draft',
};

export function CampaignDialog({ open, onOpenChange, campaign, onSuccess }: CampaignDialogProps) {
  const [form, setForm] = React.useState<CampaignFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!campaign;

  React.useEffect(() => {
    if (open) {
      if (campaign) {
        setForm({
          name: campaign.name,
          description: campaign.description ?? '',
          start_date: campaign.start_date
            ? new Date(campaign.start_date).toISOString().slice(0, 10)
            : '',
          end_date: campaign.end_date
            ? new Date(campaign.end_date).toISOString().slice(0, 10)
            : '',
          budget: campaign.budget != null ? String(campaign.budget) : '',
          status: campaign.status,
        });
      } else {
        setForm(initialForm);
      }
      setError('');
    }
  }, [open, campaign]);

  function update(field: keyof CampaignFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Campaign name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        budget: form.budget ? parseFloat(form.budget) : null,
        status: form.status,
      };

      if (isEdit) {
        await apiPatch(`/api/social/campaigns/${campaign!.id}`, payload);
      } else {
        await apiPost('/api/social/campaigns', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update campaign details' : 'Create a new marketing campaign'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Campaign Name" required>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Summer Sale 2025"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Describe the campaign objectives..."
            />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => update('start_date', e.target.value)}
              />
            </FormField>
            <FormField label="End Date">
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => update('end_date', e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Budget">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.budget}
              onChange={(e) => update('budget', e.target.value)}
              placeholder="0.00"
            />
          </FormField>
          <FormField label="Status">
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
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
              {isEdit ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
