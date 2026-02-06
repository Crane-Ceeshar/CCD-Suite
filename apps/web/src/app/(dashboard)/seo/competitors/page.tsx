import { PageHeader } from '@ccd/ui';
import { Swords } from 'lucide-react';

export default function CompetitorsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        description="Analyze competitor SEO strategies and performance"
        breadcrumbs={[
          { label: 'SEO', href: '/seo' },
          { label: 'Competitors' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <Swords className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Competitor analysis coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Monitor competitor rankings, backlinks, and content strategies to stay ahead.
        </p>
      </div>
    </div>
  );
}
