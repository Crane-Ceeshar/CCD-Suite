'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
import { LeadDialog, type LeadForDialog } from '@/components/crm/lead-dialog';

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
  website: string | null;
  lead_source: string | null;
  lead_status: string | null;
  qualification: string | null;
  notes: string | null;
  created_at: string;
  [key: string]: unknown;
}

const LEAD_STATUS_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  attempted_to_contact: 'Attempted',
  contacted: 'Contacted',
  closed: 'Closed',
};

const LEAD_SOURCE_LABELS: Record<string, string> = {
  website: 'Website',
  referral: 'Referral',
  social_media: 'Social Media',
  cold_call: 'Cold Call',
  email_campaign: 'Email Campaign',
  event: 'Event',
  other: 'Other',
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = React.useState<LeadRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editLead, setEditLead] = React.useState<LeadForDialog | null>(null);
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
    setEditLead(lead as unknown as LeadForDialog);
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
        <div className="flex items-center gap-3 min-w-[180px]">
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
      key: 'lead_source',
      header: 'Source',
      render: (lead) => lead.lead_source
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{LEAD_SOURCE_LABELS[lead.lead_source] ?? lead.lead_source}</span>
        : '-',
    },
    {
      key: 'lead_status',
      header: 'Lead Status',
      render: (lead) => {
        const status = lead.lead_status ?? 'new_lead';
        return <StatusBadge status={LEAD_STATUS_LABELS[status] ?? status} />;
      },
    },
    {
      key: 'qualification',
      header: 'Qualification',
      render: (lead) => {
        const q = lead.qualification ?? 'pending';
        const colorMap: Record<string, string> = {
          qualified: 'text-green-700 bg-green-50 border-green-200',
          unqualified: 'text-red-700 bg-red-50 border-red-200',
          pending: 'text-amber-700 bg-amber-50 border-amber-200',
        };
        const label = q.charAt(0).toUpperCase() + q.slice(1);
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${colorMap[q] ?? 'bg-muted'}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'website',
      header: 'Website',
      render: (lead) => lead.website
        ? (
          <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate max-w-[150px] block">
            {lead.website.replace(/^https?:\/\//, '')}
          </a>
        )
        : '-',
    },
    {
      key: 'created_at',
      header: 'Added',
      sortable: true,
      render: (lead) => formatDate(lead.created_at),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[140px]',
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
          onRowClick={(lead) => router.push(`/crm/leads/${lead.id}`)}
          emptyMessage="No leads found. Add a new lead to get started."
          loading={loading}
          stickyFirstColumn
        />
      </div>
      <LeadDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lead={editLead}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
