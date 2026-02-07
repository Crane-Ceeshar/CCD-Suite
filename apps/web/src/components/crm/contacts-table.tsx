'use client';

import * as React from 'react';
import {
  DataTable,
  StatusBadge,
  UserAvatar,
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
import { Pencil, Trash2, Download } from 'lucide-react';
import { apiGet, apiDelete, apiPatch } from '@/lib/api';
import { exportToCsv } from '@/components/crm/csv-import-dialog';
import Link from 'next/link';

interface ContactRow {
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

interface ContactsTableProps {
  onEdit?: (contact: ContactRow) => void;
  onRefresh?: number;
}

export function ContactsTable({ onEdit, onRefresh }: ContactsTableProps) {
  const [contacts, setContacts] = React.useState<ContactRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  const loadContacts = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiGet<ContactRow[]>(`/api/crm/contacts?${params.toString()}`);
      setContacts(res.data);
      setSelected(new Set());
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  React.useEffect(() => {
    loadContacts();
  }, [loadContacts, onRefresh]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await apiDelete(`/api/crm/contacts/${id}`);
      loadContacts();
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
    if (selected.size === contacts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(contacts.map((c) => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selected.size} contacts?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => apiDelete(`/api/crm/contacts/${id}`)));
      loadContacts();
    } catch { /* ignore */ }
  }

  async function handleBulkStatus(status: string) {
    try {
      await Promise.all(
        Array.from(selected).map((id) => apiPatch(`/api/crm/contacts/${id}`, { status }))
      );
      loadContacts();
    } catch { /* ignore */ }
  }

  function handleBulkExport() {
    const selectedContacts = contacts.filter((c) => selected.has(c.id));
    exportToCsv('contacts-selected.csv', selectedContacts);
  }

  const columns: Column<ContactRow>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-[40px]',
      render: (contact) => (
        <Checkbox
          checked={selected.has(contact.id)}
          onCheckedChange={() => toggleSelect(contact.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={`${contact.first_name} ${contact.last_name}`} size="sm" />
          <div>
            <Link
              href={`/crm/contacts/${contact.id}`}
              className="font-medium hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {contact.first_name} {contact.last_name}
            </Link>
            {contact.job_title && (
              <p className="text-xs text-muted-foreground">{contact.job_title}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: 'email', header: 'Email', render: (contact) => contact.email ?? '-' },
    { key: 'phone', header: 'Phone', render: (contact) => contact.phone ?? '-' },
    {
      key: 'company',
      header: 'Company',
      render: (contact) =>
        contact.company ? (
          <Link href={`/crm/companies/${contact.company.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
            {contact.company.name}
          </Link>
        ) : '-',
    },
    { key: 'status', header: 'Status', render: (contact) => <StatusBadge status={contact.status} /> },
    { key: 'created_at', header: 'Added', sortable: true, render: (contact) => formatDate(contact.created_at) },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (contact) => (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEdit(contact); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(contact.id); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput className="max-w-xs" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} onClear={() => setSearch('')} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
          </SelectContent>
        </Select>
        {contacts.length > 0 && (
          <Button variant="ghost" size="sm" onClick={toggleSelectAll} className="text-xs">
            {selected.size === contacts.length ? 'Deselect all' : 'Select all'}
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
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          </div>
        </div>
      )}

      <DataTable columns={columns} data={contacts} keyExtractor={(c) => c.id} emptyMessage="No contacts found. Add your first contact to get started." loading={loading} />
    </div>
  );
}
