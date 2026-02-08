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
import { BarChart3, Users, UserPlus, Activity } from 'lucide-react';
import { apiGet } from '@/lib/api';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface AnalyticsData {
  summary: {
    total_users: number;
    new_users: number;
    active_users: number;
    total_activity: number;
  };
  user_growth: Array<{ period: string; count: number }>;
  active_users_trend: Array<{ period: string; count: number }>;
  activity_by_type: Array<{ type: string; count: number }>;
}

const MODULE_COLOR = '#DC2626';
const PERIODS = ['7d', '30d', '90d'] as const;

export default function AdminAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [period, setPeriod] = React.useState<string>('30d');

  const loadAnalytics = React.useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res = await apiGet<AnalyticsData>(`/api/admin/analytics?period=${p}`);
      setData(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAnalytics(period);
  }, [period, loadAnalytics]);

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Analytics"
        description="User growth, activity trends, and platform usage insights"
        actions={
          <div className="flex gap-1 rounded-lg border p-0.5">
            {PERIODS.map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className={period === p ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                {p}
              </Button>
            ))}
          </div>
        }
      />

      {/* Stats */}
      {loading && !data ? (
        <div className="flex items-center justify-center py-8">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Users"
              value={data?.summary.total_users ?? 0}
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label={`New Users (${period})`}
              value={data?.summary.new_users ?? 0}
              icon={<UserPlus className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label={`Active Users (${period})`}
              value={data?.summary.active_users ?? 0}
              icon={<Users className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
            <StatCard
              label={`Activity (${period})`}
              value={data?.summary.total_activity ?? 0}
              icon={<Activity className="h-5 w-5 text-muted-foreground" />}
              moduleColor={MODULE_COLOR}
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* User Growth */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.user_growth?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data!.user_growth}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="period" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={(l) => `Week of ${l}`} />
                      <Line type="monotone" dataKey="count" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} name="New Users" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                    No registration data for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Users Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Active Users Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {(data?.active_users_trend?.length ?? 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data!.active_users_trend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="period" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={(l) => l as string} />
                      <Area type="monotone" dataKey="count" stroke="#DC2626" fill="#DC262620" strokeWidth={2} name="Active Users" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
                    No activity data for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity by Module */}
          {(data?.activity_by_type?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Activity by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(200, (data!.activity_by_type.length) * 40)}>
                  <BarChart data={data!.activity_by_type} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="type" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#DC2626" radius={[0, 4, 4, 0]} name="Events" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
