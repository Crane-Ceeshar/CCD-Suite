'use client';

import * as React from 'react';
import { DataTable, StatusBadge, LoadingSpinner, type Column } from '@ccd/ui';
import { formatDate } from '@ccd/shared';
import { Building2 } from 'lucide-react';

interface CompanyRow {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  email: string | null;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

const columns: Column<CompanyRow>[] = [
  {
    key: 'name',
    header: 'Company',
    sortable: true,
    render: (company) => (
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="font-medium">{company.name}</span>
      </div>
    ),
  },
  {
    key: 'industry',
    header: 'Industry',
    render: (company) => company.industry ?? '-',
  },
  {
    key: 'website',
    header: 'Website',
    render: (company) =>
      company.website ? (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {company.website.replace(/^https?:\/\//, '')}
        </a>
      ) : (
        '-'
      ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (company) => <StatusBadge status={company.status} />,
  },
  {
    key: 'created_at',
    header: 'Added',
    sortable: true,
    render: (company) => formatDate(company.created_at),
  },
];

export function CompaniesTable() {
  const [companies, setCompanies] = React.useState<CompanyRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setCompanies([]);
    setLoading(false);
  }, []);

  return (
    <DataTable
      columns={columns}
      data={companies}
      keyExtractor={(c) => c.id}
      emptyMessage="No companies found. Add your first company to get started."
      loading={loading}
    />
  );
}
