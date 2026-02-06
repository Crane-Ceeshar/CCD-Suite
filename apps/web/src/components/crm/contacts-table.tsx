'use client';

import * as React from 'react';
import { DataTable, StatusBadge, UserAvatar, LoadingSpinner, type Column } from '@ccd/ui';
import { formatDate } from '@ccd/shared';

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  status: string;
  company: { id: string; name: string } | null;
  created_at: string;
  [key: string]: unknown;
}

const columns: Column<ContactRow>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (contact) => (
      <div className="flex items-center gap-3">
        <UserAvatar name={`${contact.first_name} ${contact.last_name}`} size="sm" />
        <div>
          <p className="font-medium">{contact.first_name} {contact.last_name}</p>
          {contact.job_title && (
            <p className="text-xs text-muted-foreground">{contact.job_title}</p>
          )}
        </div>
      </div>
    ),
  },
  {
    key: 'email',
    header: 'Email',
    render: (contact) => contact.email ?? '-',
  },
  {
    key: 'phone',
    header: 'Phone',
    render: (contact) => contact.phone ?? '-',
  },
  {
    key: 'company',
    header: 'Company',
    render: (contact) => contact.company?.name ?? '-',
  },
  {
    key: 'status',
    header: 'Status',
    render: (contact) => <StatusBadge status={contact.status} />,
  },
  {
    key: 'created_at',
    header: 'Added',
    sortable: true,
    render: (contact) => formatDate(contact.created_at),
  },
];

export function ContactsTable() {
  const [contacts, setContacts] = React.useState<ContactRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setContacts([]);
    setLoading(false);
  }, []);

  return (
    <DataTable
      columns={columns}
      data={contacts}
      keyExtractor={(c) => c.id}
      emptyMessage="No contacts found. Add your first contact to get started."
      loading={loading}
    />
  );
}
