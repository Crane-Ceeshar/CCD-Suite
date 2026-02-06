import { PageHeader } from '@ccd/ui';
import { BarChart3 } from 'lucide-react';

export default function CustomDashboardsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Custom Dashboards"
        description="Build and share personalized data dashboards"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Custom Dashboards' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Custom dashboards coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Create drag-and-drop dashboards with charts, KPIs, and real-time data widgets.
        </p>
      </div>
    </div>
  );
}
