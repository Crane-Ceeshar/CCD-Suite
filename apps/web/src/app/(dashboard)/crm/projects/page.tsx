import { PageHeader } from '@ccd/ui';
import { FolderKanban } from 'lucide-react';

export default function ClientProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Projects"
        description="Manage active client engagements and deliverables"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Client Projects' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <FolderKanban className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Client projects coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Track project progress, milestones, and client communications in one place.
        </p>
      </div>
    </div>
  );
}
