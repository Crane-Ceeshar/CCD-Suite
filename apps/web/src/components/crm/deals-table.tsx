'use client';

import * as React from 'react';
import { DataTable, StatusBadge, EmptyState, LoadingSpinner, type Column } from '@ccd/ui';
import { DollarSign } from 'lucide-react';
import { formatCurrency, formatDate } from '@ccd/shared';

interface DealRow {
  id: string;
  title: string;
  value: number;
  currency: string;
  status: string;
  company: { id: string; name: string } | null;
  contact: { id: string; first_name: string; last_name: string } | null;
  stage: { id: string; name: string; color: string } | null;
  created_at: string;
  [key: string]: unknown;
}

const columns: Column<DealRow>[] = [
  { key: 'title', header: 'Deal', sortable: true },
  {
    key: 'value',
    header: 'Value',
    sortable: true,
    render: (deal) => formatCurrency(deal.value, deal.currency),
  },
  {
    key: 'stage',
    header: 'Stage',
    render: (deal) =>
      deal.stage ? (
        <span className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: deal.stage.color }}
          />
          {deal.stage.name}
        </span>
      ) : null,
  },
  {
    key: 'company',
    header: 'Company',
    render: (deal) => deal.company?.name ?? '-',
  },
  {
    key: 'status',
    header: 'Status',
    render: (deal) => <StatusBadge status={deal.status} />,
  },
  {
    key: 'created_at',
    header: 'Created',
    sortable: true,
    render: (deal) => formatDate(deal.created_at),
  },
];

export function DealsTable() {
  const [deals, setDeals] = React.useState<DealRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Placeholder - will fetch from API
    setDeals([]);
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading deals..." />;
  }

  return (
    <DataTable
      columns={columns}
      data={deals}
      keyExtractor={(deal) => deal.id}
      emptyMessage="No deals found. Create your first deal to get started."
      loading={loading}
    />
  );
}
