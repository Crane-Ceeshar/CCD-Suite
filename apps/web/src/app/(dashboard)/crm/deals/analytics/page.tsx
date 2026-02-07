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
} from '@ccd/ui';
import { TrendingUp, DollarSign, Clock, Target, Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

const MODULE_COLOR = '#0047AB';

interface AnalyticsData {
  win_rate: number;
  avg_deal_size: number;
  avg_cycle_time: number;
  pipeline_value: number;
  total_deals: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  value_by_stage: Array<{
    name: string;
    color: string;
    value: number;
    count: number;
  }>;
  trends: Array<{
    month: string;
    won: number;
    lost: number;
    created: number;
  }>;
}

export default function DealAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<AnalyticsData>('/api/crm/analytics');
        setData(res.data);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  const formatMoney = (v: number) =>
    `$${v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : v.toLocaleString()}`;

  const formatMonth = (m: string) => {
    const [year, month] = m.split('-');
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deal Analytics"
        description="Performance metrics and pipeline insights"
        breadcrumbs={[
          { label: 'CRM', href: '/crm' },
          { label: 'Deals', href: '/crm/deals' },
          { label: 'Analytics' },
        ]}
        actions={
          <Button variant="outline" onClick={() => window.location.href = '/crm/deals'}>
            Back to Deals
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Win Rate"
          value={`${data.win_rate}%`}
          change={`${data.won_deals} won / ${data.won_deals + data.lost_deals} closed`}
          trend="neutral"
          icon={<Target className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Avg Deal Size"
          value={formatMoney(data.avg_deal_size)}
          change={`From ${data.won_deals} won deals`}
          trend="neutral"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Avg Cycle Time"
          value={`${data.avg_cycle_time}d`}
          change="Days from creation to close"
          trend="neutral"
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Pipeline Value"
          value={formatMoney(data.pipeline_value)}
          change={`${data.open_deals} open deals`}
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Value by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            {data.value_by_stage.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No open deals in pipeline
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.value_by_stage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={(v) => formatMoney(v)}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Value']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.value_by_stage.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color || MODULE_COLOR} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Deal Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deal Trends (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trends.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No deal trend data available
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatMonth}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(var(--muted-foreground))"
                    allowDecimals={false}
                  />
                  <Tooltip
                    labelFormatter={(label) => formatMonth(String(label))}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#6B7280"
                    name="Created"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="won"
                    stroke="#22C55E"
                    name="Won"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="lost"
                    stroke="#EF4444"
                    name="Lost"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Deal Velocity / Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deal Volume by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          {data.value_by_stage.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No deals in pipeline
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.value_by_stage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
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
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Deals"
                  stroke={MODULE_COLOR}
                  fill={MODULE_COLOR}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Total Deals</p>
              <p className="text-xl font-semibold">{data.total_deals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Open Deals</p>
              <p className="text-xl font-semibold text-blue-600">{data.open_deals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Won Deals</p>
              <p className="text-xl font-semibold text-green-600">{data.won_deals}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Lost Deals</p>
              <p className="text-xl font-semibold text-red-600">{data.lost_deals}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
