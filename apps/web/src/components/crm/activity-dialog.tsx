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
} from '@ccd/ui';
import { Loader2 } from 'lucide-react';
import { apiPost, apiGet } from '@/lib/api';

interface ActivityFormData {
  type: string;
  title: string;
  description: string;
  deal_id: string;
  contact_id: string;
  company_id: string;
  scheduled_at: string;
}

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultDealId?: string;
  defaultContactId?: string;
  defaultCompanyId?: string;
}

const initialForm: ActivityFormData = {
  type: 'note',
  title: '',
  description: '',
  deal_id: '',
  contact_id: '',
  company_id: '',
  scheduled_at: '',
};

export function ActivityDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultDealId,
  defaultContactId,
  defaultCompanyId,
}: ActivityDialogProps) {
  const [form, setForm] = React.useState<ActivityFormData>(initialForm);
  const [deals, setDeals] = React.useState<{ id: string; title: string }[]>([]);
  const [contacts, setContacts] = React.useState<{ id: string; first_name: string; last_name: string }[]>([]);
  const [companies, setCompanies] = React.useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setForm({
        ...initialForm,
        deal_id: defaultDealId ?? '',
        contact_id: defaultContactId ?? '',
        company_id: defaultCompanyId ?? '',
      });
      setError('');

      Promise.all([
        apiGet<{ id: string; title: string }[]>('/api/crm/deals?limit=200'),
        apiGet<{ id: string; first_name: string; last_name: string }[]>('/api/crm/contacts?limit=200'),
        apiGet<{ id: string; name: string }[]>('/api/crm/companies?limit=200'),
      ]).then(([dRes, ctRes, cRes]) => {
        setDeals(dRes.data);
        setContacts(ctRes.data);
        setCompanies(cRes.data);
      }).catch(() => {});
    }
  }, [open, defaultDealId, defaultContactId, defaultCompanyId]);

  function update(field: keyof ActivityFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.type) {
      setError('Activity type is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await apiPost('/api/crm/activities', {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        deal_id: form.deal_id || null,
        contact_id: form.contact_id || null,
        company_id: form.company_id || null,
        scheduled_at: form.scheduled_at || null,
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Activity</DialogTitle>
          <DialogDescription>Log a call, email, meeting, note, or task</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Type" required>
            <Select value={form.type} onValueChange={(v) => update('type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="task">Task</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Title" required>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Follow-up call with client" />
          </FormField>
          <FormField label="Description">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Details about this activity..."
            />
          </FormField>
          <FormField label="Related Deal">
            <Select value={form.deal_id} onValueChange={(v) => update('deal_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select deal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Related Contact">
            <Select value={form.contact_id} onValueChange={(v) => update('contact_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Related Company">
            <Select value={form.company_id} onValueChange={(v) => update('company_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Scheduled At">
            <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => update('scheduled_at', e.target.value)} />
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Activity
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
