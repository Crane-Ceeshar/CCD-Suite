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

interface CompanyFormData {
  name: string;
  industry: string;
  website: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  status: string;
  notes: string;
}

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: {
    id: string;
    name: string;
    industry: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    status: string;
    notes: string | null;
  } | null;
  onSuccess: () => void;
}

const initialForm: CompanyFormData = {
  name: '',
  industry: '',
  website: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  country: '',
  status: 'active',
  notes: '',
};

export function CompanyDialog({ open, onOpenChange, company, onSuccess }: CompanyDialogProps) {
  const [form, setForm] = React.useState<CompanyFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!company;

  React.useEffect(() => {
    if (open) {
      if (company) {
        setForm({
          name: company.name,
          industry: company.industry ?? '',
          website: company.website ?? '',
          phone: company.phone ?? '',
          email: company.email ?? '',
          address: company.address ?? '',
          city: company.city ?? '',
          state: company.state ?? '',
          country: company.country ?? '',
          status: company.status,
          notes: company.notes ?? '',
        });
      } else {
        setForm(initialForm);
      }
      setError('');
    }
  }, [open, company]);

  function update(field: keyof CompanyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Company name is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name.trim(),
        industry: form.industry.trim() || null,
        website: form.website.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        country: form.country.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        await apiPatch(`/api/crm/companies/${company!.id}`, payload);
      } else {
        await apiPost('/api/crm/companies', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Company' : 'New Company'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update company information' : 'Add a new company to your CRM'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Company Name" required>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Acme Corp" />
          </FormField>
          <FormField label="Industry">
            <Input value={form.industry} onChange={(e) => update('industry', e.target.value)} placeholder="Technology" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Website">
              <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://example.com" />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
            </FormField>
          </div>
          <FormField label="Email">
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="info@company.com" />
          </FormField>
          <FormField label="Address">
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="123 Main St" />
          </FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="City">
              <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
            </FormField>
            <FormField label="State">
              <Input value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="State" />
            </FormField>
            <FormField label="Country">
              <Input value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="Country" />
            </FormField>
          </div>
          <FormField label="Status">
            <Select value={form.status} onValueChange={(v) => update('status', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
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
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
