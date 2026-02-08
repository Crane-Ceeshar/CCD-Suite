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
import { formatDate } from '@ccd/shared';
import { Building2, Trash2, Download } from 'lucide-react';
import { apiGet, apiPost, apiDelete, apiPatch } from '@/lib/api';
import { exportToCsv } from '@/components/crm/csv-import-dialog';
import Link from 'next/link';

interface CompanyRow {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  [key: string]: unknown;
}

interface CompaniesTableProps {
  onRefresh?: number;
}

export function CompaniesTable({ onRefresh }: CompaniesTableProps) {
  const [companies, setCompanies] = React.useState<CompanyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const loadCompanies = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiGet<CompanyRow[]>(`/api/crm/companies?${params.toString()}`);
      setCompanies(res.data);
      setSelected(new Set());
    } catch {
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    loadCompanies();
  }, [loadCompanies, onRefresh]);

  async function handleReorder(reorderedItems: CompanyRow[]) {
    setCompanies(reorderedItems);
    try {
      await apiPost('/api/crm/reorder', {
        table: 'companies',
        items: reorderedItems.map((item, i) => ({ id: item.id, sort_order: i })),
      });
    } catch {
      loadCompanies();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this company?')) return;
    try {
      await apiDelete(`/api/crm/companies/${id}`);
      loadCompanies();
    } catch { /* ignore */ }
  }

  async function handleCellEdit(item: CompanyRow, key: string, value: unknown) {
    // Optimistic update
    setCompanies(prev => prev.map(c => c.id === item.id ? { ...c, [key]: value } : c));
    try {
      await apiPatch(`/api/crm/companies/${item.id}`, { [key]: value });
    } catch {
      setCompanies(prev => prev.map(c => c.id === item.id ? item : c)); // rollback
    }
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
    if (selected.size === companies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(companies.map((c) => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} companies?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => apiDelete(`/api/crm/companies/${id}`)));
      loadCompanies();
    } catch { /* ignore */ }
  }

  async function handleBulkStatus(status: string) {
    try {
      await Promise.all(
        Array.from(selected).map((id) => apiPatch(`/api/crm/companies/${id}`, { status }))
      );
      loadCompanies();
    } catch { /* ignore */ }
  }

  function handleBulkExport() {
    const selectedCompanies = companies.filter((c) => selected.has(c.id));
    exportToCsv('companies-selected.csv', selectedCompanies);
  }

  const columns: Column<CompanyRow>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-[40px]',
      width: 52,
      render: (company) => (
        <Checkbox
          checked={selected.has(company.id)}
          onCheckedChange={() => toggleSelect(company.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'name',
      header: 'Company',
      sortable: true,
      width: 200,
      render: (company) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <Link href={`/crm/companies/${company.id}`} className="font-medium hover:underline" onClick={(e) => e.stopPropagation()}>
            {company.name}
          </Link>
        </div>
      ),
    },
    { key: 'industry', header: 'Industry', editable: true, render: (company) => company.industry ?? '-' },
    {
      key: 'website',
      header: 'Website',
      editable: true,
      render: (company) =>
        company.website ? (
          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {company.website.replace(/^https?:\/\//, '')}
          </a>
        ) : '-',
    },
    { key: 'email', header: 'Email', editable: true, render: (company) => company.email ?? '-' },
    { key: 'phone', header: 'Phone', editable: true, render: (company) => company.phone ?? '-' },
    { key: 'city', header: 'City', editable: true, render: (company) => company.city ?? '-' },
    { key: 'country', header: 'Country', editable: true, render: (company) => company.country ?? '-' },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'select',
      editOptions: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'prospect', label: 'Prospect' },
      ],
      render: (company) => <StatusBadge status={company.status} />,
    },
    { key: 'created_at', header: 'Added', sortable: true, render: (company) => formatDate(company.created_at) },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      render: (company) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(company.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput className="max-w-xs" placeholder="Search companies..." value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="prospect">Prospect</SelectItem>
          </SelectContent>
        </Select>
        {companies.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
            {selected.size === companies.length ? 'Deselect all' : 'Select all'}
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="prospect">Prospect</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={companies} keyExtractor={(c) => c.id} emptyMessage="No companies found. Add your first company to get started." loading={loading} draggable={true} onReorder={handleReorder} stickyColumns={2} columnDraggable onCellEdit={handleCellEdit} />
    </div>
  );
}
