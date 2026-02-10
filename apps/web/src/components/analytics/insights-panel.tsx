'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@ccd/ui';
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { apiPost } from '@/lib/api';

/* ── Types ───────────────────────────────────────────────────────── */

interface Insight {
  type: 'positive' | 'warning' | 'info' | 'action';
  title: string;
  description: string;
}

interface InsightsResponse {
  insights: Insight[];
  source: 'ai' | 'fallback';
}

interface InsightsPanelProps {
  moduleContext?: string;
}

/* ── Icon / color map ────────────────────────────────────────────── */

const INSIGHT_STYLES: Record<
  Insight['type'],
  { icon: React.ElementType; color: string; bg: string }
> = {
  positive: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  info: { icon: Lightbulb, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  action: { icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
};

/* ── Component ───────────────────────────────────────────────────── */

export function InsightsPanel({ moduleContext = 'analytics' }: InsightsPanelProps) {
  const [insights, setInsights] = React.useState<Insight[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(true);
  const [source, setSource] = React.useState<'ai' | 'fallback' | null>(null);
  const fetchedRef = React.useRef(false);

  const fetchInsights = React.useCallback(
    async (force = false) => {
      // Don't refetch on re-render if data exists (cache in state), unless forced
      if (!force && insights !== null) return;

      setLoading(true);
      try {
        const res = await apiPost<InsightsResponse>('/api/analytics/insights', {
          moduleContext,
        });
        setInsights(res.data.insights ?? []);
        setSource(res.data.source ?? null);
      } catch {
        setInsights([]);
        setSource(null);
      } finally {
        setLoading(false);
      }
    },
    [moduleContext, insights]
  );

  // Fetch on mount (once)
  React.useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleRefresh() {
    fetchInsights(true);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Insights
            {source === 'fallback' && (
              <span className="text-xs font-normal text-muted-foreground">(auto-generated)</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-1 text-xs">Refresh</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded((v) => !v)}
              className="h-8 w-8 p-0"
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-md shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : insights && insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map((insight, idx) => {
                const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.info;
                const Icon = style.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 rounded-lg p-3 ${style.bg}`}
                  >
                    <div className={`shrink-0 mt-0.5 ${style.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium ${style.color}`}>{insight.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No insights available. Add data to your modules to generate insights.
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}
