'use client';

import * as React from 'react';
import { DataTable, Badge, Button, toast, type Column } from '@ccd/ui';
import { Trash2 } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import type { Backlink } from '@ccd/shared/types/seo';

type BacklinkRow = Backlink & Record<string, unknown>;

interface BacklinksTableProps {
  backlinks: Backlink[];
  loading: boolean;
  onDelete: (id: string) => void;
  onCellEdit?: (backlink: Backlink, key: string, value: unknown) => void;
}

function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'lost') return 'destructive';
  if (status === 'pending') return 'secondary';
  return 'default';
}

function truncateUrl(url: string, max = 40) {
  if (url.length <= max) return url;
  return url.slice(0, max) + '...';
}

export function BacklinksTable({
  backlinks,
  loading,
  onDelete,
  onCellEdit,
}: BacklinksTableProps) {
  // Local copy for optimistic updates
  const [localData, setLocalData] = React.useState<BacklinkRow[]>(
    backlinks as BacklinkRow[]
  );

  // Sync local data when props change
  React.useEffect(() => {
    setLocalData(backlinks as BacklinkRow[]);
  }, [backlinks]);

  // Local sorting state
  const [sortKey, setSortKey] = React.useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key);
    setSortDirection(direction);
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey) return localData;

    return [...localData].sort((a, b) => {
      const aVal = a[sortKey as keyof Backlink];
      const bVal = b[sortKey as keyof Backlink];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDirection === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [localData, sortKey, sortDirection]);

  async function handleCellEdit(item: BacklinkRow, key: string, value: unknown) {
    const original = localData.find((row) => row.id === item.id);

    // Optimistic update
    setLocalData((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, [key]: value } : row))
    );

    // Notify parent if callback provided
    if (onCellEdit) {
      onCellEdit(item as Backlink, key, value);
    }

    try {
      await apiPatch(`/api/seo/backlinks/${item.id}`, { [key]: value });
    } catch {
      // Rollback on error
      if (original) {
        setLocalData((prev) =>
          prev.map((row) => (row.id === item.id ? original : row))
        );
      }
      toast({
        title: 'Update failed',
        description: 'Could not save backlink changes. Reverted.',
        variant: 'destructive',
      });
    }
  }

  const columns: Column<BacklinkRow>[] = [
    {
      key: 'source_url',
      header: 'Source URL',
      sortable: true,
      editable: true,
      editType: 'text',
      render: (item) => (
        <span className="text-sm" title={item.source_url}>
          {truncateUrl(item.source_url)}
        </span>
      ),
    },
    {
      key: 'target_url',
      header: 'Target URL',
      sortable: true,
      editable: true,
      editType: 'text',
      render: (item) => (
        <span className="text-sm" title={item.target_url}>
          {truncateUrl(item.target_url)}
        </span>
      ),
    },
    {
      key: 'anchor_text',
      header: 'Anchor',
      editable: true,
      editType: 'text',
      render: (item) => (
        <span className="text-sm">{item.anchor_text ?? '--'}</span>
      ),
    },
    {
      key: 'domain_authority',
      header: 'DA',
      sortable: true,
      editable: true,
      editType: 'text',
      className: 'text-right',
      render: (item) => (
        <span className="text-sm font-mono">
          {item.domain_authority != null ? item.domain_authority : '--'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'select',
      editOptions: [
        { value: 'active', label: 'Active' },
        { value: 'lost', label: 'Lost' },
        { value: 'pending', label: 'Pending' },
      ],
      className: 'text-center',
      render: (item) => (
        <Badge variant={getStatusVariant(item.status)}>{item.status}</Badge>
      ),
    },
    {
      key: 'discovered_at',
      header: 'Discovered',
      sortable: true,
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.discovered_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item) => (
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable<BacklinkRow>
      columns={columns}
      data={sortedData}
      keyExtractor={(item) => item.id}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSort={handleSort}
      onCellEdit={handleCellEdit}
      emptyMessage="No backlinks found"
      loading={loading}
    />
  );
}
