import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { ContactsTable } from '@/components/crm/contacts-table';

export default function ContactsPage() {
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        }
      />
      <ContactsTable />
    </div>
  );
}
