'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CcdLoader,
} from '@ccd/ui';
import { TrendingUp, Coins, Users, Wallet } from 'lucide-react';
import { useAiAnalytics } from '@/hooks/use-ai-analytics';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export default function AdminAiAnalyticsPage() {
  const { analytics, isLoading, error } = useAiAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Analytics"
          description="Monitor AI usage, costs, and feature adoption across your organization"
        />
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error ?? 'No analytics data available yet. AI usage will appear here once users start interacting with AI features.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  const { daily, top_users, feature_breakdown, summary } = analytics;

  // Compute max for bar scaling
  const maxTokens = Math.max(...daily.map((d) => d.tokens), 1);

  // Feature breakdown total
  const featureTotal = feature_breakdown.chat + feature_breakdown.generation + feature_breakdown.insights;
  const featureItems = [
    { label: 'Chat', count: feature_breakdown.chat, color: 'bg-blue-500' },
    { label: 'Generation', count: feature_breakdown.generation, color: 'bg-emerald-500' },
    { label: 'Insights', count: feature_breakdown.insights, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Analytics"
        description="Monitor AI usage, costs, and feature adoption across your organization"
      />

      {/* Summary stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/50">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Tokens (30d)</p>
                <p className="text-2xl font-bold">{formatNumber(summary.total_tokens)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold">${summary.estimated_cost.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950/50">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Active AI Users</p>
                <p className="text-2xl font-bold">{summary.active_users}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/50">
                <Wallet className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget Remaining</p>
                <p className="text-2xl font-bold">{formatNumber(summary.budget_remaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tokens per Day */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tokens per Day</CardTitle>
        </CardHeader>
        <CardContent>
          {daily.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No usage data yet for the last 30 days.
            </p>
          ) : (
            <div className="space-y-1.5">
              {daily.map((d) => {
                const pct = Math.max((d.tokens / maxTokens) * 100, 1);
                return (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-muted-foreground tabular-nums">
                      {d.date.slice(5)}
                    </span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-blue-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
                      {formatNumber(d.tokens)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Users</CardTitle>
          </CardHeader>
          <CardContent>
            {top_users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No user data available yet.
              </p>
            ) : (
              <div className="space-y-3">
                {top_users.map((u, i) => (
                  <div key={u.user_id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.requests} requests</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatNumber(u.tokens)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {featureTotal === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No feature usage data available yet.
              </p>
            ) : (
              <div className="space-y-4">
                {featureItems.map((item) => {
                  const pct = featureTotal > 0 ? Math.round((item.count / featureTotal) * 100) : 0;
                  return (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.label}</span>
                        <span className="text-muted-foreground">
                          {item.count.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
