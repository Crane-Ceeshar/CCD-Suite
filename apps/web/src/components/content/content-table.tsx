'use client';

import * as React from 'react';
import { DataTable, StatusBadge, Badge, type Column } from '@ccd/ui';
import { formatDate } from '@ccd/shared';

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

const columns: Column<ContentRow>[] = [
  { key: 'title', header: 'Title', sortable: true },
  {
    key: 'content_type', header: 'Type',
    render: (item) => (
      <Badge variant="outline" className="capitalize">
        {item.content_type.replace(/_/g, ' ')}
      </Badge>
    ),
  },
  { key: 'status', header: 'Status', render: (item) => <StatusBadge status={item.status} /> },
  {
    key: 'category', header: 'Category',
    render: (item) => item.category ? (
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.category.color ?? '#94a3b8' }} />
        {item.category.name}
      </span>
    ) : '-',
  },
  {
    key: 'publish_date', header: 'Publish Date', sortable: true,
    render: (item) => item.publish_date ? formatDate(item.publish_date) : '-',
  },
  { key: 'created_at', header: 'Created', sortable: true, render: (item) => formatDate(item.created_at) },
];

export function ContentTable() {
  const [items, setItems] = React.useState<ContentRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setItems([]);
    setLoading(false);
  }, []);

  return (
    <DataTable
      columns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      emptyMessage="No content found. Create your first content piece to get started."
      loading={loading}
    />
  );
}
