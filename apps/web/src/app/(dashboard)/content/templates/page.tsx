import { PageHeader } from '@ccd/ui';
import { LayoutTemplate } from 'lucide-react';

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Reusable content templates for faster creation"
        breadcrumbs={[
          { label: 'Content', href: '/content' },
          { label: 'Templates' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <LayoutTemplate className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Templates coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Create and manage reusable templates for blog posts, social media, emails, and more.
        </p>
      </div>
    </div>
  );
}
