'use client';

import * as React from 'react';
import { DataTable, StatusBadge, Badge, Button, Checkbox, SearchInput, ConfirmationDialog, toast, type Column } from '@ccd/ui';
import { formatDate } from '@ccd/shared';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Archive, Eye, Copy } from 'lucide-react';

interface ContentRow {
  id: string;
  title: string;
  content_type: string;
  status: string;
  publish_date: string | null;
  category: { id: string; name: string; color: string } | null;
  tags: string[];
  created_at: string;
  [key: string]: unknown;
}

interface ContentTableProps {
  statusFilter?: string;
  typeFilter?: string;
}

export function ContentTable({ statusFilter, typeFilter }: ContentTableProps) {
  const router = useRouter();
  const [items, setItems] = React.useState<ContentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = React.useState(false);

  const fetchItems = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      params.set('limit', '100');

      const res = await apiGet<ContentRow[]>(`/api/content?${params.toString()}`);
      setItems(res.data ?? []);
    } catch {
      /* handled by apiGet */
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Clear selections when data changes
  React.useEffect(() => {
    setSelectedIds(new Set());
  }, [items]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  async function handleBulkAction(action: 'archive' | 'delete') {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await apiPost('/api/content/bulk', { action, ids: Array.from(selectedIds) });
      toast({
        title: action === 'archive' ? 'Archived' : 'Deleted',
        description: `${selectedIds.size} item(s) ${action === 'archive' ? 'archived' : 'deleted'} successfully`,
      });
      setSelectedIds(new Set());
      fetchItems();
    } catch {
      toast({ title: 'Error', description: `Failed to ${action} items`, variant: 'destructive' });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleArchive(id: string) {
    try {
      await apiPatch(`/api/content/${id}`, { status: 'archived' });
      fetchItems();
    } catch {
      /* handled */
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/content/${id}?hard=true`);
      fetchItems();
    } catch {
      /* handled */
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await apiPost<{ id: string }>(`/api/content/${id}/duplicate`, {});
      toast({ title: 'Duplicated', description: 'Content cloned as a new draft' });
      router.push(`/content/editor?id=${res.data.id}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to duplicate content', variant: 'destructive' });
    }
  }

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  const columns: Column<ContentRow>[] = [
    {
      key: 'select',
      header: '',
      className: 'w-[40px]',
      render: (item) => (
        <Checkbox
          checked={selectedIds.has(item.id)}
          onCheckedChange={() => toggleSelect(item.id)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (item) => (
        <button
          className="text-left font-medium hover:underline text-sm"
          onClick={() => router.push(`/content/editor?id=${item.id}`)}
        >
          {item.title}
        </button>
      ),
    },
    {
      key: 'content_type',
      header: 'Type',
      render: (item) => (
        <Badge variant="outline" className="capitalize text-xs">
          {item.content_type.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) =>
        item.category ? (
          <span className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.category.color ?? '#94a3b8' }}
            />
            <span className="text-sm">{item.category.name}</span>
          </span>
        ) : (
          <span className="text-muted-foreground">&mdash;</span>
        ),
    },
    {
      key: 'publish_date',
      header: 'Publish Date',
      sortable: true,
      render: (item) =>
        item.publish_date ? (
          <span className="text-sm">{formatDate(item.publish_date)}</span>
        ) : (
          <span className="text-muted-foreground">&mdash;</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      render: (item) => <span className="text-sm">{formatDate(item.created_at)}</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Edit"
            onClick={() => router.push(`/content/editor?id=${item.id}`)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Clone"
            onClick={() => handleDuplicate(item.id)}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {item.status !== 'published' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="View"
              onClick={() => router.push(`/content/editor?id=${item.id}`)}
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          )}
          {item.status !== 'archived' && (
            <ConfirmationDialog
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-amber-600"
                  title="Archive"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              }
              title="Archive Content"
              description={`Are you sure you want to archive "${item.title}"? You can restore it later from the archived view.`}
              confirmLabel="Archive"
              onConfirm={() => handleArchive(item.id)}
            />
          )}
          <ConfirmationDialog
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
            title="Delete Content"
            description={`Are you sure you want to permanently delete "${item.title}"? This action cannot be undone.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={() => handleDelete(item.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search content..."
          className="max-w-sm"
        />
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">
            {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <ConfirmationDialog
              trigger={
                <Button variant="outline" size="sm" disabled={bulkLoading}>
                  <Archive className="mr-2 h-3.5 w-3.5" />
                  Archive Selected
                </Button>
              }
              title="Archive Selected"
              description={`Are you sure you want to archive ${selectedIds.size} item(s)?`}
              confirmLabel="Archive"
              onConfirm={() => handleBulkAction('archive')}
            />
            <ConfirmationDialog
              trigger={
                <Button variant="destructive" size="sm" disabled={bulkLoading}>
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete Selected
                </Button>
              }
              title="Delete Selected"
              description={`Are you sure you want to permanently delete ${selectedIds.size} item(s)? This action cannot be undone.`}
              confirmLabel="Delete"
              variant="destructive"
              onConfirm={() => handleBulkAction('delete')}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(item) => item.id}
        emptyMessage="No content found. Create your first content piece to get started."
        loading={loading}
      />
    </div>
  );
}
