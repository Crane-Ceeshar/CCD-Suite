import { PageHeader } from '@ccd/ui';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages"
        description="Direct messaging with clients"
        breadcrumbs={[
          { label: 'Client Portal', href: '/portal' },
          { label: 'Messages' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Messaging coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Communicate with clients through threaded conversations, notifications, and real-time chat.
        </p>
      </div>
    </div>
  );
}
