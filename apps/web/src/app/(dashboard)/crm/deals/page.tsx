import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { DealsTable } from '@/components/crm/deals-table';

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Deals"
        description="All deals across your pipelines"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Deals' },
        ]}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Deal
          </Button>
        }
      />
      <DealsTable />
    </div>
  );
}
