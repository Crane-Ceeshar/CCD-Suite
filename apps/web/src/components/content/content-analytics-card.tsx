'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { BarChart3, Eye, Users, Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────

interface AnalyticsSummary {
  views: number;
  unique_views: number;
  avg_time_seconds: number;
  engagement_score: number;
  bounce_rate: number;
}

interface ContentAnalyticsData {
  items: Array<{
    id: string;
    views: number;
    unique_views: number;
    avg_time_seconds: number;
    engagement_score: number;
    bounce_rate: number;
    recorded_at: string;
  }>;
  summary: AnalyticsSummary;
}

interface ContentAnalyticsCardProps {
  contentId: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

// ── Component ──────────────────────────────────────────────────────

export function ContentAnalyticsCard({ contentId }: ContentAnalyticsCardProps) {
  const [data, setData] = React.useState<ContentAnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await apiGet<ContentAnalyticsData>(
          `/api/content/${contentId}/analytics?period=30d`
        );
        if (!cancelled) {
          setData(res.data);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err instanceof Error ? err.message : 'Failed to load analytics');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAnalytics();
    return () => { cancelled = true; };
  }, [contentId]);

  const stats = [
    {
      label: 'Views',
      value: data?.summary.views.toLocaleString() ?? '0',
      icon: Eye,
    },
    {
      label: 'Unique Views',
      value: data?.summary.unique_views.toLocaleString() ?? '0',
      icon: Users,
    },
    {
      label: 'Avg. Time',
      value: data ? formatDuration(data.summary.avg_time_seconds) : '0s',
      icon: Clock,
    },
    {
      label: 'Engagement',
      value: data ? formatPercent(data.summary.engagement_score) : '0.0%',
      icon: TrendingUp,
    },
    {
      label: 'Bounce Rate',
      value: data ? formatPercent(data.summary.bounce_rate) : '0.0%',
      icon: BarChart3,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Content Analytics
          <span className="text-xs text-muted-foreground font-normal">Last 30 days</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : errorMsg ? (
          <div className="flex items-center gap-2 py-4 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center space-y-1">
                  <Icon className="h-4 w-4 mx-auto text-muted-foreground" />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
