import { PageHeader, EmptyState } from '@ccd/ui';
import { Calendar } from 'lucide-react';

export default function EditorialCalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Editorial Calendar"
        description="Plan and schedule content publication"
        breadcrumbs={[{ label: 'Content', href: '/content' }, { label: 'Calendar' }]}
      />
      <EmptyState
        icon={<Calendar className="h-6 w-6 text-muted-foreground" />}
        title="Editorial Calendar"
        description="The editorial calendar shows scheduled and published content. Create content with a publish date to see it here."
      />
    </div>
  );
}
