'use client';

import * as React from 'react';
import {
  PageHeader,
  StatCard,
  CcdLoader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import {
  DollarSign,
  FolderKanban,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { apiGet } from '@/lib/api';
import { AnalyticsChartCard } from '@/components/analytics/analytics-chart-card';
import { ProjectAnalyticsCards } from '@/components/projects/project-analytics-cards';
import { WorkloadChart } from '@/components/projects/workload-chart';
import { CompletionTrendChart } from '@/components/projects/completion-trend-chart';
import { BudgetBurnChart } from '@/components/projects/budget-burn-chart';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const MODULE_COLOR = '#6366F1';

interface ProjectOption {
  id: string;
  name: string;
}

interface OverviewStats {
  active_projects: number;
  total_tasks: number;
  total_hours: number;
  avg_budget_burn_pct: number;
  tasks_by_status: Array<{ status: string; count: number }>;
  tasks_by_priority: Array<{ priority: string; count: number }>;
}

interface WorkloadMember {
  user_id: string;
  full_name: string;
  assigned_tasks: number;
  completed_tasks: number;
  hours_this_week: number;
  total_points: number;
}

interface TrendPoint {
  period: string;
  completed: number;
  created: number;
}

interface ProjectAnalyticsData {
  task_completion_rate: number;
  avg_task_duration_days: number;
  total_hours: number;
  billable_hours: number;
  budget_burn_pct: number;
  overdue_count: number;
  total_cost: number;
  budget: number | null;
  member_count: number;
  cost_by_month: Array<{ month: string; cost: number; cumulative: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#94A3B8',
  in_progress: '#6366F1',
  in_review: '#F59E0B',
  done: '#22C55E',
  blocked: '#EF4444',
  cancelled: '#6B7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#22C55E',
  none: '#94A3B8',
};

function formatStatusLabel(status: unknown): string {
  return String(status)
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function ProjectAnalyticsPage() {
  const [loading, setLoading] = React.useState(true);
  const [projects, setProjects] = React.useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<string>('all');

  // Overview data (all projects)
  const [overview, setOverview] = React.useState<OverviewStats | null>(null);
  const [workload, setWorkload] = React.useState<WorkloadMember[]>([]);
  const [trends, setTrends] = React.useState<TrendPoint[]>([]);

  // Per-project data
  const [projectData, setProjectData] = React.useState<ProjectAnalyticsData | null>(null);
  const [projectLoading, setProjectLoading] = React.useState(false);

  // Load projects list
  React.useEffect(() => {
    apiGet<ProjectOption[]>('/api/projects?limit=100')
      .then((res) => setProjects(res.data))
      .catch(() => {});
  }, []);

  // Load overview analytics
  React.useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGet<OverviewStats>('/api/projects/analytics/overview').catch(() => null),
      apiGet<WorkloadMember[]>('/api/projects/analytics/workload').catch(() => null),
      apiGet<TrendPoint[]>('/api/projects/analytics/completion-trends').catch(() => null),
    ])
      .then(([overviewRes, workloadRes, trendsRes]) => {
        if (overviewRes?.data) setOverview(overviewRes.data);
        if (workloadRes?.data) setWorkload(workloadRes.data);
        if (trendsRes?.data) setTrends(trendsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load per-project analytics when a project is selected
  React.useEffect(() => {
    if (selectedProject === 'all') {
      setProjectData(null);
      return;
    }
    setProjectLoading(true);
    apiGet<ProjectAnalyticsData>(`/api/projects/${selectedProject}/analytics`)
      .then((res) => setProjectData(res.data))
      .catch(() => setProjectData(null))
      .finally(() => setProjectLoading(false));
  }, [selectedProject]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Analytics"
        description="Insights into project performance, team workload, and trends"
        breadcrumbs={[
          { label: 'Projects', href: '/projects' },
          { label: 'Analytics' },
        ]}
        actions={
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* KPI Cards */}
      {selectedProject !== 'all' ? (
        <ProjectAnalyticsCards data={projectData} loading={projectLoading} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Projects"
            value={String(overview?.active_projects ?? 0)}
            icon={<FolderKanban className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Total Tasks"
            value={String(overview?.total_tasks ?? 0)}
            icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Hours Tracked"
            value={`${overview?.total_hours ?? 0}h`}
            icon={<Clock className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Avg Budget Burn"
            value={`${overview?.avg_budget_burn_pct ?? 0}%`}
            change={
              (overview?.avg_budget_burn_pct ?? 0) >= 80
                ? 'High burn across projects'
                : 'Healthy average'
            }
            trend={
              (overview?.avg_budget_burn_pct ?? 0) >= 80
                ? 'down'
                : 'up'
            }
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Completion Trends — spans 2 cols */}
        <AnalyticsChartCard
          title="Completion Trends"
          description="Tasks created vs completed over time"
          empty={trends.length === 0}
          className="lg:col-span-2"
        >
          <CompletionTrendChart data={trends} />
        </AnalyticsChartCard>

        {/* Team Workload */}
        <AnalyticsChartCard
          title="Team Workload"
          description="Tasks assigned and completed per member"
          empty={workload.length === 0}
        >
          <WorkloadChart data={workload} />
        </AnalyticsChartCard>
      </div>

      {/* Budget Burn + Status/Priority breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget Burn — only when a project with budget is selected */}
        {selectedProject !== 'all' && projectData && (
          <AnalyticsChartCard
            title="Budget Burn"
            description="Cumulative cost vs project budget"
            loading={projectLoading}
            empty={!projectData.cost_by_month || projectData.cost_by_month.length === 0}
          >
            <BudgetBurnChart
              totalCost={projectData.total_cost}
              budget={projectData.budget}
              costByMonth={projectData.cost_by_month ?? []}
            />
          </AnalyticsChartCard>
        )}

        {/* Tasks by Status */}
        <AnalyticsChartCard
          title="Tasks by Status"
          description="Distribution of tasks across statuses"
          empty={!overview?.tasks_by_status || overview.tasks_by_status.length === 0}
        >
          {overview?.tasks_by_status && overview.tasks_by_status.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={overview.tasks_by_status}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="status"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={formatStatusLabel}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={formatStatusLabel}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {overview.tasks_by_status.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={STATUS_COLORS[entry.status] ?? MODULE_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsChartCard>

        {/* Tasks by Priority */}
        <AnalyticsChartCard
          title="Tasks by Priority"
          description="Task distribution by priority level"
          empty={!overview?.tasks_by_priority || overview.tasks_by_priority.length === 0}
        >
          {overview?.tasks_by_priority && overview.tasks_by_priority.length > 0 && (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={overview.tasks_by_priority}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="priority"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={formatStatusLabel}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  allowDecimals={false}
                />
                <Tooltip
                  labelFormatter={formatStatusLabel}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Tasks" radius={[4, 4, 0, 0]}>
                  {overview.tasks_by_priority.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={PRIORITY_COLORS[entry.priority] ?? MODULE_COLOR}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </AnalyticsChartCard>
      </div>
    </div>
  );
}
