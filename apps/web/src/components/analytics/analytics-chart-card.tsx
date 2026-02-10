'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { Skeleton } from '@ccd/ui';
import { BarChart3 } from 'lucide-react';

interface AnalyticsChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function AnalyticsChartCard({
  title,
  description,
  loading,
  empty,
  emptyMessage = 'No data available for this period',
  children,
  className,
  actions,
}: AnalyticsChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[280px] w-full" />
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}
