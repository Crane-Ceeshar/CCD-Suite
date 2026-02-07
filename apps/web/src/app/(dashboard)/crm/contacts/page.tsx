'use client';

import * as React from 'react';
import { PageHeader, Button } from '@ccd/ui';
import { Plus, Download, Upload } from 'lucide-react';
import { ContactsTable } from '@/components/crm/contacts-table';
import { ContactDialog } from '@/components/crm/contact-dialog';
import { CsvImportDialog, exportToCsv } from '@/components/crm/csv-import-dialog';
import { apiGet } from '@/lib/api';

type ContactForDialog = Parameters<typeof ContactDialog>[0]['contact'];

export default function ContactsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [editContact, setEditContact] = React.useState<ContactForDialog>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  function handleNew() {
    setEditContact(null);
    setDialogOpen(true);
  }

  function handleSuccess() {
    setRefreshKey((k) => k + 1);
  }

  async function handleExport() {
    try {
      const res = await apiGet<Record<string, unknown>[]>('/api/crm/contacts?limit=10000');
      exportToCsv('contacts.csv', res.data);
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Manage your contacts and relationships"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Contacts' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={handleNew}>
              <Plus className="mr-2 h-4 w-4" />
              New Contact
            </Button>
          </div>
        }
      />
      <ContactsTable
        onEdit={(contact) => {
          setEditContact(contact as unknown as ContactForDialog);
          setDialogOpen(true);
        }}
        onRefresh={refreshKey}
      />
      <ContactDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contact={editContact}
        onSuccess={handleSuccess}
      />
      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity="contacts"
        onSuccess={handleSuccess}
      />
    </div>
  );
}
