import { PageHeader } from '@ccd/ui';
import { TrendingUp } from 'lucide-react';

export default function RankTrackerPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rank Tracker"
        description="Monitor your search engine rankings over time"
        breadcrumbs={[
          { label: 'SEO', href: '/seo' },
          { label: 'Rank Tracker' },
        ]}
      />
      <div className="rounded-xl border border-dashed border-border/60 p-12 text-center">
        <TrendingUp className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Rank tracking coming soon</p>
        <p className="text-xs text-muted-foreground/60 mt-1.5 max-w-sm mx-auto">
          Track keyword positions across search engines with daily updates and trend analysis.
        </p>
      </div>
    </div>
  );
}
