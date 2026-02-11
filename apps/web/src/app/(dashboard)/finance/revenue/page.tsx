'use client';

import { useState } from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import {
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRevenue } from '@/hooks/use-finance';
import { ExportDialog } from '@/components/finance/export-dialog';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MODULE_COLOR = '#14B8A6';

const PERIOD_OPTIONS = [
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'ytd', label: 'Year to Date' },
  { value: 'all', label: 'All Time' },
];

const PIE_COLORS = [
  '#14B8A6', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#6366F1', '#10B981', '#F97316', '#06B6D4',
];

const AGING_COLORS: Record<string, string> = {
  current: '#10B981',
  '1_30': '#84CC16',
  '31_60': '#F59E0B',
  '61_90': '#F97316',
  '90_plus': '#EF4444',
};

const AGING_LABELS: Record<string, string> = {
  current: 'Current',
  '1_30': '1-30 days',
  '31_60': '31-60 days',
  '61_90': '61-90 days',
  '90_plus': '90+ days',
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatCurrency(value: number | undefined | null): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function CurrencyTooltipFormatter(value: string | number | undefined) {
  return formatCurrency(Number(value ?? 0));
}

/* -------------------------------------------------------------------------- */
/*  Skeleton Components                                                        */
/* -------------------------------------------------------------------------- */

function StatCardSkeleton() {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ backgroundColor: MODULE_COLOR }}
      />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function ChartSkeleton({ height = 'h-[350px]' }: { height?: string }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${height} rounded-lg`} />
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Revenue Dashboard Page                                                     */
/* -------------------------------------------------------------------------- */

export default function RevenuePage() {
  const [period, setPeriod] = useState('1y');
  const [exportOpen, setExportOpen] = useState(false);

  const { data: rawData, isLoading } = useRevenue(period);

  // Safely extract nested data with defaults
  const data = rawData?.data as {
    total_revenue?: number;
    total_outstanding?: number;
    total_expenses?: number;
    net_profit?: number;
    monthly_trends?: { month: string; revenue: number; expenses: number; profit: number }[];
    top_clients?: { id: string; name: string; revenue: number }[];
    aging_buckets?: Record<string, number>;
    expenses_by_category?: { category: string; amount: number }[];
  } | undefined;

  const totalRevenue: number = data?.total_revenue ?? 0;
  const totalOutstanding: number = data?.total_outstanding ?? 0;
  const totalExpenses: number = data?.total_expenses ?? 0;
  const netProfit: number = data?.net_profit ?? 0;
  const monthlyTrends = data?.monthly_trends ?? [];
  const topClients = data?.top_clients ?? [];
  const agingBuckets: Record<string, number> = data?.aging_buckets ?? {};
  const expensesByCategory = data?.expenses_by_category ?? [];

  // Transform aging buckets for the chart
  const agingData = Object.entries(agingBuckets).map(([key, value]) => ({
    bucket: AGING_LABELS[key] ?? key,
    amount: value,
    fill: AGING_COLORS[key] ?? '#94A3B8',
  }));

  // Limit top clients to 10
  const topClientsData = topClients.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Revenue"
        description="Track revenue streams and financial performance"
        breadcrumbs={[
          { label: 'Finance', href: '/finance' },
          { label: 'Revenue' },
        ]}
      >
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setExportOpen(true)}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              label="Total Revenue"
              value={formatCurrency(totalRevenue)}
              change={PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period}
              trend={totalRevenue > 0 ? 'up' : 'neutral'}
              icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(totalOutstanding)}
              change="Unpaid invoices"
              trend={totalOutstanding > 0 ? 'down' : 'neutral'}
              icon={<FileText className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Expenses"
              value={formatCurrency(totalExpenses)}
              change={PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? period}
              trend={totalExpenses > 0 ? 'down' : 'neutral'}
              icon={<Receipt className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label="Net Profit"
              value={formatCurrency(netProfit)}
              change="Revenue - Expenses"
              trend={netProfit > 0 ? 'up' : netProfit < 0 ? 'down' : 'neutral'}
              icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend (Area Chart) */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue Trend</CardTitle>
              <CardDescription>Monthly revenue vs expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrends.length === 0 ? (
                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                  No trend data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={formatCurrencyCompact}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip formatter={CurrencyTooltipFormatter} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#10B981"
                      fill="url(#revenueGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#EF4444"
                      fill="url(#expensesGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Income vs Expenses (Bar Chart) */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Income vs Expenses</CardTitle>
              <CardDescription>Monthly comparison with profit overlay</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyTrends.length === 0 ? (
                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                  No comparison data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={formatCurrencyCompact}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip formatter={CurrencyTooltipFormatter} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Clients (Horizontal Bar Chart) */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top Clients</CardTitle>
              <CardDescription>Top 10 clients by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {topClientsData.length === 0 ? (
                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                  No client data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={topClientsData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      type="number"
                      tickFormatter={formatCurrencyCompact}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip formatter={CurrencyTooltipFormatter} />
                    <Bar dataKey="revenue" name="Revenue" fill={MODULE_COLOR} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoice Aging (Bar Chart) */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Aging</CardTitle>
              <CardDescription>Outstanding invoices by age bucket</CardDescription>
            </CardHeader>
            <CardContent>
              {agingData.length === 0 ? (
                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                  No aging data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={agingData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="bucket"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tickFormatter={formatCurrencyCompact}
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip formatter={CurrencyTooltipFormatter} />
                    <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                      {agingData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expenses by Category (Pie Chart) */}
        {isLoading ? (
          <ChartSkeleton />
        ) : (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Expenses by Category</CardTitle>
              <CardDescription>Breakdown of expenses across categories</CardDescription>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length === 0 ? (
                <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
                  No expense data available for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={140}
                      innerRadius={70}
                      paddingAngle={2}
                      label={({ name, percent }: { name?: string; percent?: number }) =>
                        `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {expensesByCategory.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={CurrencyTooltipFormatter} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Export Dialog */}
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
