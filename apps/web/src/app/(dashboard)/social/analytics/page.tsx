'use client';

import { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, CcdLoader, Button, CcdSpinner, toast } from '@ccd/ui';
import { ThumbsUp, MessageCircle, Share, TrendingUp, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { SocialEngagement } from '@ccd/shared/types/social';

interface AnalyticsSummary {
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number;
  chartData: { name: string; value: number }[];
}

export default function SocialAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    engagementRate: 0,
    chartData: [],
  });

  async function loadAnalytics() {
    try {
      const res = await apiGet<{ likes: number; comments: number; shares: number; impressions: number }>('/api/social/engagement');
      const data = res.data;
      if (!data) return;

      const totalEngagement = (data.likes ?? 0) + (data.comments ?? 0) + (data.shares ?? 0);
      const engagementRate =
        (data.impressions ?? 0) > 0
          ? Math.round((totalEngagement / (data.impressions ?? 1)) * 10000) / 100
          : 0;

      const chartData = [
        { name: 'Likes', value: data.likes ?? 0 },
        { name: 'Comments', value: data.comments ?? 0 },
        { name: 'Shares', value: data.shares ?? 0 },
      ];

      setSummary({
        totalLikes: data.likes ?? 0,
        totalComments: data.comments ?? 0,
        totalShares: data.shares ?? 0,
        engagementRate,
        chartData,
      });
    } catch {
      // keep defaults
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await apiPost('/api/social/analytics/sync', {});
      toast({ title: 'Analytics refreshed', description: 'Latest data synced from your social accounts' });
      await loadAnalytics();
    } catch (err) {
      toast({ title: 'Sync failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Social media performance overview"
        breadcrumbs={[
          { label: 'Social Media', href: '/social' },
          { label: 'Analytics' },
        ]}
        actions={
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
            {syncing ? (
              <CcdSpinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Refresh Analytics
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Likes"
          value={summary.totalLikes.toLocaleString()}
          trend="neutral"
          icon={<ThumbsUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Total Comments"
          value={summary.totalComments.toLocaleString()}
          trend="neutral"
          icon={<MessageCircle className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Total Shares"
          value={summary.totalShares.toLocaleString()}
          trend="neutral"
          icon={<Share className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Engagement Rate"
          value={`${summary.engagementRate}%`}
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
      </div>

      {/* Engagement Breakdown Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engagement Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={summary.chartData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" name="Count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No engagement data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
