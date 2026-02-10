'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';

interface FunnelStage {
  name: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  title?: string;
}

const STAGE_COLORS = [
  '#8B5CF6',
  '#7C3AED',
  '#6D28D9',
  '#5B21B6',
  '#4C1D95',
  '#3B0764',
];

export function FunnelChart({ stages, title = 'Sales Funnel' }: FunnelChartProps) {
  if (stages.length === 0) return null;

  const maxCount = stages[0]?.count || 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.map((stage, i) => {
          const widthPct = Math.max((stage.count / maxCount) * 100, 8);
          const color = STAGE_COLORS[i % STAGE_COLORS.length];

          return (
            <div key={stage.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium capitalize">{stage.name.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{stage.count} deals</span>
                  {i > 0 && (
                    <span className={`font-medium ${stage.conversionRate >= 50 ? 'text-green-600' : stage.conversionRate >= 25 ? 'text-amber-600' : 'text-red-600'}`}>
                      {stage.conversionRate}%
                    </span>
                  )}
                </div>
              </div>
              <div className="relative h-8 bg-muted rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-700 flex items-center justify-center"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: color,
                  }}
                >
                  {widthPct > 20 && (
                    <span className="text-xs text-white font-medium">
                      {stage.count}
                    </span>
                  )}
                </div>
              </div>
              {i > 0 && stage.dropoffRate > 0 && (
                <p className="text-xs text-muted-foreground pl-1">
                  {stage.dropoffRate}% drop-off from previous stage
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
