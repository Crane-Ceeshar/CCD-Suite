'use client';

import * as React from 'react';
import { DataTable, Badge, Button, type Column } from '@ccd/ui';
import { TrendingUp, TrendingDown, Minus, Trash2 } from 'lucide-react';
import type { SeoKeyword } from '@ccd/shared/types/seo';

/* ------------------------------------------------------------------ */
/*  Row type — adds index signature so DataTable<T extends Record<    */
/*  string, unknown>> constraint is satisfied                         */
/* ------------------------------------------------------------------ */
type KeywordRow = SeoKeyword & Record<string, unknown>;

/* ------------------------------------------------------------------ */
/*  Props                                                             */
/* ------------------------------------------------------------------ */
interface KeywordTableProps {
  keywords: SeoKeyword[];
  loading: boolean;
  onEdit: (kw: SeoKeyword) => void;
  onDelete: (id: string) => void;
  onCellEdit?: (keyword: SeoKeyword, key: string, value: unknown) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function getRankChange(current: number | null, previous: number | null) {
  if (current == null || previous == null)
    return { icon: Minus, color: 'text-muted-foreground', text: '--' };
  const diff = previous - current; // positive = improved
  if (diff > 0)
    return { icon: TrendingUp, color: 'text-green-600', text: `+${diff}` };
  if (diff < 0)
    return { icon: TrendingDown, color: 'text-red-600', text: `${diff}` };
  return { icon: Minus, color: 'text-muted-foreground', text: '0' };
}

function getDifficultyColor(d: number) {
  if (d < 30) return 'bg-green-500';
  if (d <= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'achieved':
      return 'default';
    case 'paused':
      return 'secondary';
    default:
      return 'outline';
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */
export function KeywordTable({
  keywords,
  loading,
  onEdit,
  onDelete,
  onCellEdit,
}: KeywordTableProps) {
  /* ---------- local optimistic copy ---------- */
  const [rows, setRows] = React.useState<KeywordRow[]>(
    keywords as KeywordRow[]
  );

  // Keep local rows in sync when parent keywords change
  React.useEffect(() => {
    setRows(keywords as KeywordRow[]);
  }, [keywords]);

  /* ---------- sorting ---------- */
  const [sortKey, setSortKey] = React.useState<string>('');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  function handleSort(key: string, direction: 'asc' | 'desc') {
    setSortKey(key);
    setSortDir(direction);
  }

  const sorted = React.useMemo(() => {
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      const sa = String(av);
      const sb = String(bv);
      return sortDir === 'asc'
        ? sa.localeCompare(sb)
        : sb.localeCompare(sa);
    });
  }, [rows, sortKey, sortDir]);

  /* ---------- inline cell edit ---------- */
  async function handleCellEdit(
    item: KeywordRow,
    key: string,
    value: unknown
  ) {
    // Optimistic update on local rows
    setRows((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, [key]: value } : r))
    );

    // Delegate API call to parent — parent handles apiPatch, rollback, and toasts
    if (onCellEdit) {
      onCellEdit(item as SeoKeyword, key, value);
    }
  }

  /* ---------- columns ---------- */
  const columns: Column<KeywordRow>[] = [
    {
      key: 'keyword',
      header: 'Keyword',
      sortable: true,
      editable: true,
      editType: 'text',
      render: (item) => (
        <div>
          <p className="font-medium">{item.keyword}</p>
          {item.url && (
            <p className="text-xs text-muted-foreground truncate max-w-xs">
              {item.url}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'current_rank',
      header: 'Rank',
      sortable: true,
      render: (item) => (
        <span className="font-mono">
          {item.current_rank != null ? item.current_rank : '--'}
        </span>
      ),
    },
    {
      key: 'previous_rank',
      header: 'Change',
      render: (item) => {
        const change = getRankChange(item.current_rank, item.previous_rank);
        const ChangeIcon = change.icon;
        return (
          <span
            className={`flex items-center gap-1 ${change.color}`}
          >
            <ChangeIcon className="h-3 w-3" />
            {change.text}
          </span>
        );
      },
    },
    {
      key: 'search_volume',
      header: 'Volume',
      sortable: true,
      editable: true,
      editType: 'text',
      render: (item) => (
        <span>
          {item.search_volume != null
            ? item.search_volume.toLocaleString()
            : '--'}
        </span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      sortable: true,
      editable: true,
      editType: 'text',
      render: (item) =>
        item.difficulty != null ? (
          <div className="flex items-center gap-2">
            <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${getDifficultyColor(item.difficulty)}`}
                style={{ width: `${item.difficulty}%` }}
              />
            </div>
            <span className="text-xs tabular-nums">{item.difficulty}</span>
          </div>
        ) : (
          <span>--</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'select',
      editOptions: [
        { value: 'tracking', label: 'Tracking' },
        { value: 'paused', label: 'Paused' },
        { value: 'achieved', label: 'Achieved' },
      ],
      render: (item) => (
        <Badge
          variant={getStatusBadgeVariant(item.status)}
          className={
            item.status === 'achieved'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : undefined
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'url',
      header: 'URL',
      editable: true,
      editType: 'text',
      render: (item) =>
        item.url ? (
          <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
            {item.url}
          </span>
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[80px]',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item as SeoKeyword);
            }}
          >
            Edit
          </Button>
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
    <DataTable
      columns={columns}
      data={sorted}
      keyExtractor={(item) => item.id}
      onSort={handleSort}
      sortKey={sortKey}
      sortDirection={sortDir}
      onCellEdit={handleCellEdit}
      emptyMessage="No keywords found. Add keywords to start tracking rankings."
      loading={loading}
    />
  );
}
