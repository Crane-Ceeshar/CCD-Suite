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

interface DealFormData {
  title: string;
  pipeline_id: string;
  stage_id: string;
  company_id: string;
  contact_id: string;
  value: string;
  currency: string;
  expected_close_date: string;
  notes: string;
}

interface PipelineOption {
  id: string;
  name: string;
  stages: { id: string; name: string; color: string | null; position: number }[];
}

interface CompanyOption { id: string; name: string }
interface ContactOption { id: string; first_name: string; last_name: string }

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: {
    id: string;
    title: string;
    pipeline_id: string;
    stage_id: string;
    company_id: string | null;
    contact_id: string | null;
    value: number;
    currency: string;
    expected_close_date: string | null;
    notes: string | null;
    company?: { id: string; name: string } | null;
    contact?: { id: string; first_name: string; last_name: string } | null;
    stage?: { id: string; name: string; color: string } | null;
  } | null;
  onSuccess: () => void;
}

const initialForm: DealFormData = {
  title: '',
  pipeline_id: '',
  stage_id: '',
  company_id: '',
  contact_id: '',
  value: '0',
  currency: 'USD',
  expected_close_date: '',
  notes: '',
};

export function DealDialog({ open, onOpenChange, deal, onSuccess }: DealDialogProps) {
  const [form, setForm] = React.useState<DealFormData>(initialForm);
  const [pipelines, setPipelines] = React.useState<PipelineOption[]>([]);
  const [companies, setCompanies] = React.useState<CompanyOption[]>([]);
  const [contacts, setContacts] = React.useState<ContactOption[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!deal;

  const currentPipeline = pipelines.find((p) => p.id === form.pipeline_id);
  const stages = currentPipeline?.stages ?? [];

  React.useEffect(() => {
    if (open) {
      if (deal) {
        setForm({
          title: deal.title,
          pipeline_id: deal.pipeline_id,
          stage_id: deal.stage_id,
          company_id: deal.company_id ?? '',
          contact_id: deal.contact_id ?? '',
          value: String(deal.value),
          currency: deal.currency,
          expected_close_date: deal.expected_close_date?.split('T')[0] ?? '',
          notes: deal.notes ?? '',
        });
      } else {
        setForm(initialForm);
      }
      setError('');

      // Load pipelines, companies, contacts
      Promise.all([
        apiGet<PipelineOption[]>('/api/crm/pipelines'),
        apiGet<CompanyOption[]>('/api/crm/companies?limit=200'),
        apiGet<ContactOption[]>('/api/crm/contacts?limit=200'),
      ]).then(([pRes, cRes, ctRes]) => {
        setPipelines(pRes.data);
        setCompanies(cRes.data);
        setContacts(ctRes.data);
        // Auto-select default pipeline if creating
        if (!deal && pRes.data.length > 0) {
          const defaultPipeline = pRes.data.find((p: PipelineOption) => (p as PipelineOption & { is_default: boolean }).is_default) ?? pRes.data[0];
          setForm((prev) => ({
            ...prev,
            pipeline_id: defaultPipeline.id,
            stage_id: defaultPipeline.stages[0]?.id ?? '',
          }));
        }
      }).catch(() => {});
    }
  }, [open, deal]);

  function update(field: keyof DealFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Deal title is required');
      return;
    }
    if (!form.pipeline_id || !form.stage_id) {
      setError('Pipeline and stage are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        pipeline_id: form.pipeline_id,
        stage_id: form.stage_id,
        company_id: form.company_id || null,
        contact_id: form.contact_id || null,
        value: parseFloat(form.value) || 0,
        currency: form.currency,
        expected_close_date: form.expected_close_date || null,
        notes: form.notes.trim() || null,
      };

      if (isEdit) {
        await apiPatch(`/api/crm/deals/${deal!.id}`, payload);
      } else {
        await apiPost('/api/crm/deals', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deal');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Deal' : 'New Deal'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update deal information' : 'Create a new deal in your pipeline'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Deal Title" required>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="New website project" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pipeline" required>
              <Select
                value={form.pipeline_id}
                onValueChange={(v) => {
                  update('pipeline_id', v);
                  const p = pipelines.find((p) => p.id === v);
                  if (p?.stages[0]) update('stage_id', p.stages[0].id);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Stage" required>
              <Select value={form.stage_id} onValueChange={(v) => update('stage_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color ?? '#94a3b8' }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Value">
              <Input type="number" step="0.01" value={form.value} onChange={(e) => update('value', e.target.value)} />
            </FormField>
            <FormField label="Currency">
              <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="NGN">NGN</SelectItem>
                </SelectContent>
              </Select>
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
          <FormField label="Contact">
            <Select value={form.contact_id} onValueChange={(v) => update('contact_id', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Expected Close Date">
            <Input type="date" value={form.expected_close_date} onChange={(e) => update('expected_close_date', e.target.value)} />
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
              {isEdit ? 'Save Changes' : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
