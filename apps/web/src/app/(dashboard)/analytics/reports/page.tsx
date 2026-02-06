import { PageHeader, EmptyState } from '@ccd/ui';
import { FileBarChart } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Generate and export detailed analytics reports"
        breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Reports' }]}
      />
      <EmptyState
        icon={<FileBarChart className="h-6 w-6 text-muted-foreground" />}
        title="Reports"
        description="Generate custom reports from your analytics data. Reports can be exported as CSV or PDF."
      />
    </div>
  );
}
