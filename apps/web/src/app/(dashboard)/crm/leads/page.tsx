'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  DataTable,
  StatusBadge,
  SearchInput,
  UserAvatar,
  type Column,
} from '@ccd/ui';
import { formatDate } from '@ccd/shared';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { ContactDialog } from '@/components/crm/contact-dialog';

type ContactForDialog = Parameters<typeof ContactDialog>[0]['contact'];

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  status: string;
  company: { id: string; name: string } | null;
  company_id: string | null;
  notes: string | null;
  created_at: string;
  [key: string]: unknown;
}

export default function LeadsPage() {
  const [leads, setLeads] = React.useState<LeadRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editLead, setEditLead] = React.useState<ContactForDialog>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const loadLeads = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: 'lead' });
      if (search) params.set('search', search);
      const res = await apiGet<LeadRow[]>(`/api/crm/contacts?${params.toString()}`);
      setLeads(res.data);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  React.useEffect(() => {
    loadLeads();
  }, [loadLeads, refreshKey]);

  function handleNew() {
    setEditLead(null);
    setDialogOpen(true);
  }

  function handleEdit(lead: LeadRow) {
    setEditLead(lead as unknown as ContactForDialog);
    setDialogOpen(true);
  }

  async function handleConvert(id: string) {
    try {
      await apiPatch(`/api/crm/contacts/${id}`, { status: 'active' });
      setRefreshKey((k) => k + 1);
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this lead?')) return;
    try {
      await apiDelete(`/api/crm/contacts/${id}`);
      loadLeads();
    } catch { /* ignore */ }
  }

  const columns: Column<LeadRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (lead) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={`${lead.first_name} ${lead.last_name}`} size="sm" />
          <div>
            <p className="font-medium">{lead.first_name} {lead.last_name}</p>
            {lead.job_title && <p className="text-xs text-muted-foreground">{lead.job_title}</p>}
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (lead) => lead.email ?? '-' },
    { key: 'phone', header: 'Phone', render: (lead) => lead.phone ?? '-' },
    { key: 'company', header: 'Company', render: (lead) => lead.company?.name ?? '-' },
    {
      key: 'created_at',
      header: 'Added',
      sortable: true,
      render: (lead) => formatDate(lead.created_at),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[120px]',
      render: (lead) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-green-600 hover:text-green-700"
            onClick={(e) => { e.stopPropagation(); handleConvert(lead.id); }}
          >
            <UserCheck className="mr-1 h-3 w-3" /> Convert
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleEdit(lead); }}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Track and qualify incoming leads"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Leads' },
        ]}
        actions={
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
        }
      />
      <div className="space-y-4">
        <SearchInput
          className="max-w-xs"
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
        />
        <DataTable
          columns={columns}
          data={leads}
          keyExtractor={(l) => l.id}
          emptyMessage="No leads found. Add a new lead to get started."
          loading={loading}
        />
      </div>
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editLead ?? undefined}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
