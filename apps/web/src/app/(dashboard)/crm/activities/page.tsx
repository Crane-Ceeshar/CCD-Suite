import { PageHeader } from '@ccd/ui';
import { Activity } from 'lucide-react';

export default function ActivitiesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activities"
        description="Track calls, meetings, emails, and tasks"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Activities' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Activity className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Activity tracking coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Log and schedule calls, meetings, emails, and follow-ups across all your deals.
        </p>
      </div>
    </div>
  );
}
