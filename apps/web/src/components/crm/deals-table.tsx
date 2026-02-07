'use client';

import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  SearchInput,
  Button,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  type Column,
} from '@ccd/ui';
import { formatCurrency, formatDate } from '@ccd/shared';
import { Pencil, Trash2, Download } from 'lucide-react';
import { apiGet, apiDelete, apiPatch } from '@/lib/api';
import { exportToCsv } from '@/components/crm/csv-import-dialog';
import Link from 'next/link';

interface DealRow {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  pipeline_id: string;
  stage_id: string;
  company_id: string | null;
  contact_id: string | null;
  expected_close_date: string | null;
  notes: string | null;
  company: { id: string; name: string } | null;
  contact: { id: string; first_name: string; last_name: string } | null;
  stage: { id: string; name: string; color: string } | null;
  created_at: string;
  [key: string]: unknown;
}

interface DealsTableProps {
  onEdit?: (deal: DealRow) => void;
  onRefresh?: number;
}

export function DealsTable({ onEdit, onRefresh }: DealsTableProps) {
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const loadDeals = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiGet<DealRow[]>(`/api/crm/deals?${params.toString()}`);
      setDeals(res.data);
      setSelected(new Set());
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    loadDeals();
  }, [loadDeals, onRefresh]);

  async function handleReorder(reorderedItems: DealRow[]) {
    setDeals(reorderedItems);
    try {
      await Promise.all(
        reorderedItems.map((item, i) => apiPatch(`/api/crm/deals/${item.id}`, { position: i }))
      );
    } catch {
      loadDeals();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    try {
      await apiDelete(`/api/crm/deals/${id}`);
      loadDeals();
    } catch { /* ignore */ }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === deals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(deals.map((d) => d.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} deals?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => apiDelete(`/api/crm/deals/${id}`)));
      loadDeals();
    } catch { /* ignore */ }
  }

  async function handleBulkStatus(status: string) {
    try {
      await Promise.all(
        Array.from(selected).map((id) => apiPatch(`/api/crm/deals/${id}`, { status }))
      );
      loadDeals();
    } catch { /* ignore */ }
  }

  function handleBulkExport() {
    const selectedDeals = deals.filter((d) => selected.has(d.id));
    exportToCsv('deals-selected.csv', selectedDeals);
  }

  const columns: Column<DealRow>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-[40px]',
      render: (deal) => (
        <Checkbox
          checked={selected.has(deal.id)}
          onCheckedChange={() => toggleSelect(deal.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    { key: 'title', header: 'Deal', sortable: true },
    { key: 'value', header: 'Value', sortable: true, render: (deal) => formatCurrency(deal.value, deal.currency) },
    {
      key: 'stage',
      header: 'Stage',
      render: (deal) =>
        deal.stage ? (
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: deal.stage.color }} />
            {deal.stage.name}
          </span>
        ) : null,
    },
    {
      key: 'company',
      header: 'Company',
      render: (deal) =>
        deal.company ? (
          <Link href={`/crm/companies/${deal.company.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {deal.company.name}
          </Link>
        ) : '-',
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (deal) =>
        deal.contact ? (
          <Link href={`/crm/contacts/${deal.contact.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {deal.contact.first_name} {deal.contact.last_name}
          </Link>
        ) : '-',
    },
    { key: 'status', header: 'Status', render: (deal) => <StatusBadge status={deal.status} /> },
    { key: 'created_at', header: 'Created', sortable: true, render: (deal) => formatDate(deal.created_at) },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (deal) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(deal); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput className="max-w-xs" placeholder="Search deals..." value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        {deals.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
            {selected.size === deals.length ? 'Deselect all' : 'Select all'}
          </Button>
        )}
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkExport}>
              <Download className="mr-1 h-3 w-3" /> Export
            </Button>
            <Select onValueChange={handleBulkStatus}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Set status..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={deals} keyExtractor={(deal) => deal.id} emptyMessage="No deals found. Create your first deal to get started." loading={loading} draggable={true} onReorder={handleReorder} />
    </div>
  );
}
