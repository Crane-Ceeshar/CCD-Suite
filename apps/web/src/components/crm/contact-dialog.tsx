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
import { apiPost, apiPatch, apiGet } from '@/lib/api';

interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  company_id: string;
  status: string;
  notes: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    job_title: string | null;
    company_id?: string | null;
    company?: { id: string; name: string } | null;
    status: string;
    notes: string | null;
  } | null;
  onSuccess: () => void;
}

const initialForm: ContactFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  job_title: '',
  company_id: '',
  status: 'active',
  notes: '',
};

export function ContactDialog({ open, onOpenChange, contact, onSuccess }: ContactDialogProps) {
  const [form, setForm] = React.useState<ContactFormData>(initialForm);
  const [companies, setCompanies] = React.useState<CompanyOption[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!contact;

  React.useEffect(() => {
    if (open) {
      if (contact) {
        setForm({
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email ?? '',
          phone: contact.phone ?? '',
          job_title: contact.job_title ?? '',
          company_id: contact.company_id ?? contact.company?.id ?? '',
          status: contact.status,
          notes: contact.notes ?? '',
        });
      } else {
        setForm(initialForm);
      }
      setError('');
      // Load companies
      apiGet<CompanyOption[]>('/api/crm/companies?limit=200')
        .then((res) => setCompanies(res.data))
        .catch(() => {});
    }
  }, [open, contact]);

  function update(field: keyof ContactFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First name and last name are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        job_title: form.job_title.trim() || null,
        company_id: form.company_id || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        await apiPatch(`/api/crm/contacts/${contact!.id}`, payload);
      } else {
        await apiPost('/api/crm/contacts', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Contact' : 'New Contact'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update contact information' : 'Add a new contact to your CRM'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="First Name" required>
              <Input value={form.first_name} onChange={(e) => update('first_name', e.target.value)} placeholder="John" />
            </FormField>
            <FormField label="Last Name" required>
              <Input value={form.last_name} onChange={(e) => update('last_name', e.target.value)} placeholder="Doe" />
            </FormField>
          </div>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
          </FormField>
          <FormField label="Job Title">
            <Input value={form.job_title} onChange={(e) => update('job_title', e.target.value)} placeholder="Sales Manager" />
          </FormField>
          <FormField label="Company">
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
          <FormField label="Status">
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Any additional notes..."
            />
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Contact'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
