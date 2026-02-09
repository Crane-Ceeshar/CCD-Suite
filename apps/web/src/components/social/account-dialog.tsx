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
import { apiPost } from '@/lib/api';

const platformConfigs = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2' },
  { id: 'instagram', label: 'Instagram', color: '#E4405F' },
  { id: 'twitter', label: 'X (Twitter)', color: '#000000' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2' },
  { id: 'tiktok', label: 'TikTok', color: '#000000' },
  { id: 'youtube', label: 'YouTube', color: '#FF0000' },
];

interface AccountFormData {
  platform: string;
  account_name: string;
  account_id: string;
}

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const initialForm: AccountFormData = {
  platform: 'facebook',
  account_name: '',
  account_id: '',
};

export function AccountDialog({ open, onOpenChange, onSuccess }: AccountDialogProps) {
  const [form, setForm] = React.useState<AccountFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError('');
    }
  }, [open]);

  function update(field: keyof AccountFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedPlatform = platformConfigs.find((p) => p.id === form.platform);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.account_name.trim()) {
      setError('Account name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost('/api/social/accounts', {
        platform: form.platform,
        account_name: form.account_name.trim(),
        account_id: form.account_id.trim() || null,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Social Account</DialogTitle>
          <DialogDescription>
            Add a new social media account to your workspace
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Platform" required>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full shrink-0"
                style={{ backgroundColor: selectedPlatform?.color ?? '#888' }}
              />
              <Select value={form.platform} onValueChange={(v) => update('platform', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformConfigs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormField>
          <FormField label="Account Name" required>
            <Input
              value={form.account_name}
              onChange={(e) => update('account_name', e.target.value)}
              placeholder="@yourhandle"
            />
          </FormField>
          <FormField label="Account ID">
            <Input
              value={form.account_id}
              onChange={(e) => update('account_id', e.target.value)}
              placeholder="Optional external ID"
            />
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Connect Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
