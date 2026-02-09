'use client';

import { Card, CardContent } from '@ccd/ui';
import { Globe, Search, Link as LinkIcon } from 'lucide-react';

interface CompetitorCardProps {
  domain: string;
  metrics: {
    domain_authority: number | null;
    keywords: number | null;
    backlinks: number | null;
  };
}

function MetricValue({ value, formatter }: { value: number | null; formatter?: (v: number) => string }) {
  if (value === null) {
    return <span className="text-muted-foreground">&mdash;</span>;
  }
  return <>{formatter ? formatter(value) : value}</>;
}

export function CompetitorCard({ domain, metrics }: CompetitorCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{domain}</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: '#9BBD2B' }}>
              <MetricValue value={metrics.domain_authority} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">DA Score</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Search className="h-3 w-3 text-muted-foreground" />
              <p className="text-2xl font-bold">
                <MetricValue value={metrics.keywords} formatter={(v) => v.toLocaleString()} />
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Keywords</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <LinkIcon className="h-3 w-3 text-muted-foreground" />
              <p className="text-2xl font-bold">
                <MetricValue value={metrics.backlinks} formatter={(v) => v.toLocaleString()} />
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Backlinks</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
