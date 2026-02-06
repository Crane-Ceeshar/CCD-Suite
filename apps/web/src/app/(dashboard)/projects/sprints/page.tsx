import { PageHeader } from '@ccd/ui';
import { Zap } from 'lucide-react';

export default function SprintsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sprints"
        description="Manage agile sprints and iterations"
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Sprints' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Zap className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Sprints coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Plan sprints, manage backlogs, and track velocity with burndown charts and retrospectives.
        </p>
      </div>
    </div>
  );
}
