'use client';

import * as React from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  CcdLoader,
} from '@ccd/ui';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Share2,
  Search,
  Users,
  RefreshCw,
  BarChart3,
  LayoutDashboard,
  Target,
  GitBranch,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { AskAiButton } from '@/components/ai/ask-ai-button';
import { DateRangePicker, type PeriodValue } from '@/components/shared/date-range-picker';
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MODULE_COLOR = '#8B5CF6';

// ── Types ─────────────────────────────────────────────────────────

interface OverviewData {
  period: string;
  crm: {
    total_revenue: number;
    pipeline_value: number;
    active_deals: number;
    won_deals: number;
    total_deals: number;
  };
  social: {
    total_engagement: number;
    engagement_rate: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
  };
  seo: {
    audit_score: number | null;
    avg_keyword_position: number | null;
    tracked_keywords: number;
  };
  content: {
    total: number;
    published: number;
    drafts: number;
    scheduled: number;
    in_review: number;
  };
  team: {
    members: number;
  };
}

interface TrendBucket {
  label: string;
  [key: string]: string | number;
}

interface TrendsData {
  period: string;
  revenue?: TrendBucket[];
  content?: TrendBucket[];
  social?: TrendBucket[];
  seo?: TrendBucket[];
}

// ── Helpers ───────────────────────────────────────────────────────

const formatMoney = (v: number) =>
  v >= 1000000
    ? `$${(v / 1000000).toFixed(1)}M`
    : v >= 1000
      ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`
      : `$${v.toLocaleString()}`;

const formatCompact = (v: number) =>
  v >= 1000000
    ? `${(v / 1000000).toFixed(1)}M`
    : v >= 1000
      ? `${(v / 1000).toFixed(1)}k`
      : v.toLocaleString();

// ── Component ─────────────────────────────────────────────────────

export default function AnalyticsDashboardPage() {
  const [period, setPeriod] = React.useState<PeriodValue>('30d');
  const [overview, setOverview] = React.useState<OverviewData | null>(null);
  const [trends, setTrends] = React.useState<TrendsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchData = React.useCallback(async (p: PeriodValue, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        apiGet<OverviewData>(`/api/analytics/overview?period=${p}`),
        apiGet<TrendsData>(`/api/analytics/trends?period=${p}`),
      ]);
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
    } catch {
      /* toast handled by apiGet */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  function handlePeriodChange(p: PeriodValue) {
    setPeriod(p);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  const crm = overview?.crm;
  const social = overview?.social;
  const seo = overview?.seo;
  const content = overview?.content;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Cross-platform performance tracking and insights"
        actions={
          <div className="flex items-center gap-3">
            <DateRangePicker value={period} onChange={handlePeriodChange} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(period, true)}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Revenue"
          value={formatMoney(crm?.total_revenue ?? 0)}
          change={`${crm?.won_deals ?? 0} deals won`}
          trend={crm?.total_revenue ? 'up' : 'neutral'}
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Pipeline Value"
          value={formatMoney(crm?.pipeline_value ?? 0)}
          change={`${crm?.active_deals ?? 0} active deals`}
          trend={crm?.pipeline_value ? 'up' : 'neutral'}
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Active Deals"
          value={String(crm?.active_deals ?? 0)}
          change={`${crm?.total_deals ?? 0} total deals`}
          trend="neutral"
          icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Content Published"
          value={String(content?.published ?? 0)}
          change={`${content?.total ?? 0} total items`}
          trend={content?.published ? 'up' : 'neutral'}
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Social Engagement"
          value={formatCompact(social?.total_engagement ?? 0)}
          change={`${social?.engagement_rate ?? 0}% rate`}
          trend={social?.total_engagement ? 'up' : 'neutral'}
          icon={<Share2 className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="SEO Score"
          value={seo?.audit_score != null ? `${seo.audit_score}/100` : '—'}
          change={
            seo?.avg_keyword_position != null
              ? `Avg rank: #${seo.avg_keyword_position}`
              : `${seo?.tracked_keywords ?? 0} keywords`
          }
          trend={seo?.audit_score && seo.audit_score >= 70 ? 'up' : 'neutral'}
          icon={<Search className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <AnalyticsChartCard
          title="Revenue Trend"
          description="Won deal revenue over time"
          loading={!trends}
          empty={!trends?.revenue?.some((b) => (b.value as number) > 0)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trends?.revenue ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v) => formatMoney(v)}
              />
              <Tooltip
                formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                name="Revenue"
                stroke={MODULE_COLOR}
                fill={MODULE_COLOR}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </AnalyticsChartCard>

        {/* Module Activity */}
        <AnalyticsChartCard
          title="Social Engagement Trend"
          description="Likes, comments, and shares over time"
          loading={!trends}
          empty={!trends?.social?.some((b) => (b.total as number) > 0)}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trends?.social ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="likes" name="Likes" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="comments" name="Comments" fill="#3B82F6" radius={[2, 2, 0, 0]} />
              <Bar dataKey="shares" name="Shares" fill="#22C55E" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsChartCard>
      </div>

      {/* ── Quick Links ────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/analytics/dashboards">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                Custom Dashboards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Build drag-and-drop dashboards with custom widgets
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/reports">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Generate and export detailed performance reports
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/crm/deals/analytics">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                CRM Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Deal pipeline metrics and sales performance
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/goals">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                Goals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Set and track progress toward metric targets
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/funnel">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                Sales Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                CRM pipeline conversion analysis
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Team Overview ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-muted-foreground" />
            Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Team Members</p>
              <p className="text-xl font-semibold">{overview?.team?.members ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Deals</p>
              <p className="text-xl font-semibold text-blue-600">{crm?.total_deals ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Content Items</p>
              <p className="text-xl font-semibold text-purple-600">{content?.total ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Tracked Keywords</p>
              <p className="text-xl font-semibold text-green-600">{seo?.tracked_keywords ?? 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Impressions</p>
              <p className="text-xl font-semibold text-amber-600">
                {formatCompact(social?.impressions ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AskAiButton moduleContext="analytics" />
    </div>
  );
}
