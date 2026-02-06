import { PageHeader } from '@ccd/ui';
import { CheckCircle } from 'lucide-react';

export default function ApprovalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review and approve content before publishing"
        breadcrumbs={[
          { label: 'Content', href: '/content' },
          { label: 'Approvals' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <CheckCircle className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Approvals coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Set up approval workflows with multi-step review processes and automated notifications.
        </p>
      </div>
    </div>
  );
}
