import { PageHeader } from '@ccd/ui';
import { UserCheck } from 'lucide-react';

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Track and qualify incoming leads"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Leads' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <UserCheck className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Leads management coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Capture, score, and nurture leads through your sales funnel with automated workflows.
        </p>
      </div>
    </div>
  );
}
