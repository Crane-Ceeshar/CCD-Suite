import { PageHeader, Button } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { CompaniesTable } from '@/components/crm/companies-table';

export default function CompaniesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Track organisations and business relationships"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Companies' },
        ]}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Company
          </Button>
        }
      />
      <CompaniesTable />
    </div>
  );
}
