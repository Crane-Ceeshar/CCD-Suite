import { PageHeader } from '@ccd/ui';
import { Database } from 'lucide-react';

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description="Connect and manage your analytics data sources"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Data Sources' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Database className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Data sources coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Connect Google Analytics, social platforms, CRM data, and custom APIs for unified reporting.
        </p>
      </div>
    </div>
  );
}
