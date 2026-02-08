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

interface LeadFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  company_id: string;
  website: string;
  lead_source: string;
  lead_status: string;
  qualification: string;
  notes: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

export interface LeadForDialog {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  company_id?: string | null;
  company?: { id: string; name: string } | null;
  website: string | null;
  lead_source: string | null;
  lead_status: string | null;
  qualification: string | null;
  notes: string | null;
}

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: LeadForDialog | null;
  onSuccess: () => void;
}

const initialForm: LeadFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  job_title: '',
  company_id: '',
  website: '',
  lead_source: '',
  lead_status: 'new_lead',
  qualification: 'pending',
  notes: '',
};

const LEAD_SOURCES = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
];

const LEAD_STATUSES = [
  { value: 'new_lead', label: 'New Lead' },
  { value: 'attempted_to_contact', label: 'Attempted to Contact' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'closed', label: 'Closed' },
];

const QUALIFICATIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'unqualified', label: 'Unqualified' },
];

export function LeadDialog({ open, onOpenChange, lead, onSuccess }: LeadDialogProps) {
  const [form, setForm] = React.useState<LeadFormData>(initialForm);
  const [companies, setCompanies] = React.useState<CompanyOption[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!lead;

  React.useEffect(() => {
    if (open) {
      if (lead) {
        setForm({
          first_name: lead.first_name,
          last_name: lead.last_name,
          email: lead.email ?? '',
          phone: lead.phone ?? '',
          job_title: lead.job_title ?? '',
          company_id: lead.company_id ?? lead.company?.id ?? '',
          website: lead.website ?? '',
          lead_source: lead.lead_source ?? '',
          lead_status: lead.lead_status ?? 'new_lead',
          qualification: lead.qualification ?? 'pending',
          notes: lead.notes ?? '',
        });
      } else {
        setForm(initialForm);
      }
      setError('');
      apiGet<CompanyOption[]>('/api/crm/companies?limit=200')
        .then((res) => setCompanies(res.data))
        .catch(() => {});
    }
  }, [open, lead]);

  function update(field: keyof LeadFormData, value: string) {
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
        company_id: form.company_id && form.company_id !== '__none' ? form.company_id : null,
        status: 'lead',
        website: form.website.trim() || null,
        lead_source: form.lead_source || null,
        lead_status: form.lead_status || 'new_lead',
        qualification: form.qualification || 'pending',
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        await apiPatch(`/api/crm/contacts/${lead!.id}`, payload);
      } else {
        await apiPost('/api/crm/contacts', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Lead' : 'New Lead'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update lead information' : 'Add a new lead to track and qualify'}
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
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="john@example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Job Title">
              <Input value={form.job_title} onChange={(e) => update('job_title', e.target.value)} placeholder="Sales Manager" />
            </FormField>
            <FormField label="Website">
              <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" />
            </FormField>
          </div>
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
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Lead Source">
              <Select value={form.lead_source} onValueChange={(v) => update('lead_source', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={form.lead_status} onValueChange={(v) => update('lead_status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Qualification">
              <Select value={form.qualification} onValueChange={(v) => update('qualification', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {QUALIFICATIONS.map((q) => (
                    <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Any additional notes about this lead..."
            />
          </FormField>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
