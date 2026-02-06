import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Button, EmptyState } from '@ccd/ui';
import { BarChart3, TrendingUp, Users, DollarSign, Plus, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Cross-platform performance tracking and insights"
        actions={<Button variant="outline"><Plus className="mr-2 h-4 w-4" />Add Widget</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value="$0" change="+0% from last month" trend="neutral" icon={<DollarSign className="h-5 w-5 text-muted-foreground" />} moduleColor="#8B5CF6" />
        <StatCard label="Active Deals" value="0" icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />} moduleColor="#8B5CF6" />
        <StatCard label="Team Members" value="0" icon={<Users className="h-5 w-5 text-muted-foreground" />} moduleColor="#8B5CF6" />
        <StatCard label="Tasks Completed" value="0" icon={<BarChart3 className="h-5 w-5 text-muted-foreground" />} moduleColor="#8B5CF6" />
      </div>
      <EmptyState
        icon={<LayoutDashboard className="h-6 w-6 text-muted-foreground" />}
        title="Dashboard Widgets"
        description="Add widgets to create your custom analytics dashboard. Charts will populate as data flows in from CRM, Projects, and Content modules."
        action={<Button><Plus className="mr-2 h-4 w-4" />Create Dashboard</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/analytics/reports">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader><CardTitle className="text-base">Reports</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Generate and export detailed reports</p></CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
