import { PageHeader } from '@ccd/ui';
import { TrendingUp } from 'lucide-react';

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue"
        description="Track revenue streams and financial performance"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Revenue' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Revenue tracking coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Monitor MRR, ARR, churn, and revenue forecasts with detailed breakdowns by client and service.
        </p>
      </div>
    </div>
  );
}
