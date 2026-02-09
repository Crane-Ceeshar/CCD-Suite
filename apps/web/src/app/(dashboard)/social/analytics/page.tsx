'use client';

import { useState, useEffect } from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, CcdLoader } from '@ccd/ui';
import { ThumbsUp, MessageCircle, Share, TrendingUp } from 'lucide-react';
import { apiGet } from '@/lib/api';
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
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    engagementRate: 0,
    chartData: [],
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<SocialEngagement[]>('/api/social/engagement');
        const data = res.data ?? [];

        const totals = data.reduce(
          (acc, row) => {
            acc.likes += row.likes ?? 0;
            acc.comments += row.comments ?? 0;
            acc.shares += row.shares ?? 0;
            acc.impressions += row.impressions ?? 0;
            return acc;
          },
          { likes: 0, comments: 0, shares: 0, impressions: 0 }
        );

        const totalEngagement = totals.likes + totals.comments + totals.shares;
        const engagementRate =
          totals.impressions > 0
            ? Math.round((totalEngagement / totals.impressions) * 10000) / 100
            : 0;

        const chartData = [
          { name: 'Likes', value: totals.likes },
          { name: 'Comments', value: totals.comments },
          { name: 'Shares', value: totals.shares },
        ];

        setSummary({
          totalLikes: totals.likes,
          totalComments: totals.comments,
          totalShares: totals.shares,
          engagementRate,
          chartData,
        });
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
