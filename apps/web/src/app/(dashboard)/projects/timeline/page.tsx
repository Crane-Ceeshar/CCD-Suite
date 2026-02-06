import { PageHeader, EmptyState } from '@ccd/ui';
import { CalendarRange } from 'lucide-react';

export default function TimelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Timeline"
        description="Gantt-style project timeline view"
        breadcrumbs={[{ label: 'Projects', href: '/projects' }, { label: 'Timeline' }]}
      />
      <EmptyState
        icon={<CalendarRange className="h-6 w-6 text-muted-foreground" />}
        title="Timeline View"
        description="The timeline view will show a Gantt chart of project tasks and milestones."
      />
    </div>
  );
}
