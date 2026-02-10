'use client';

import * as React from 'react';
import { Badge } from '@ccd/ui';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface AnomalyIndicatorProps {
  type: 'high' | 'low';
  deviation: number;
  label?: string;
  compact?: boolean;
}

export function AnomalyIndicator({ type, deviation, label, compact = false }: AnomalyIndicatorProps) {
  const isHigh = type === 'high';

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-medium ${
          isHigh ? 'text-amber-600' : 'text-red-600'
        }`}
        title={`Anomaly detected: ${deviation.toFixed(1)}σ ${isHigh ? 'above' : 'below'} average${label ? ` — ${label}` : ''}`}
      >
        <AlertTriangle className="h-3 w-3" />
      </span>
    );
  }

  return (
    <Badge
      variant="secondary"
      className={`gap-1 text-xs ${
        isHigh
          ? 'bg-amber-50 text-amber-700 border-amber-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {isHigh ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {deviation.toFixed(1)}σ {isHigh ? 'high' : 'low'}
      {label && <span className="text-muted-foreground ml-1">({label})</span>}
    </Badge>
  );
}

interface AnomalyBadgeListProps {
  anomalies: Array<{
    metric: string;
    type: 'high' | 'low';
    deviation: number;
  }>;
}

export function AnomalyBadgeList({ anomalies }: AnomalyBadgeListProps) {
  if (anomalies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {anomalies.map((a, i) => (
        <AnomalyIndicator
          key={`${a.metric}-${i}`}
          type={a.type}
          deviation={a.deviation}
          label={a.metric}
        />
      ))}
    </div>
  );
}
