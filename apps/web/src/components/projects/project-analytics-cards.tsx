'use client';

import * as React from 'react';
import { StatCard } from '@ccd/ui';
import { CheckCircle, Clock, DollarSign, AlertTriangle } from 'lucide-react';

const MODULE_COLOR = '#6366F1';

interface ProjectAnalyticsCardsProps {
  data: {
    task_completion_rate: number;
    avg_task_duration_days: number;
    total_hours: number;
    billable_hours: number;
    budget_burn_pct: number;
    overdue_count: number;
    total_cost: number;
    budget: number | null;
    member_count: number;
  } | null;
  loading?: boolean;
}

function getBudgetTrend(pct: number): 'up' | 'down' | 'neutral' {
  if (pct >= 80) return 'down';
  if (pct >= 60) return 'neutral';
  return 'up';
}

function getBudgetChange(pct: number): string {
  if (pct >= 80) return 'Over 80% — at risk';
  if (pct >= 60) return 'Moderate burn rate';
  return 'Healthy burn rate';
}

export function ProjectAnalyticsCards({ data, loading }: ProjectAnalyticsCardsProps) {
  if (loading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completion Rate"
          value="—"
          icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Hours Tracked"
          value="—"
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Budget Burn"
          value="—"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Overdue Tasks"
          value="—"
          icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Completion Rate"
        value={`${data.task_completion_rate}%`}
        change={`${data.avg_task_duration_days}d avg task duration`}
        trend={data.task_completion_rate >= 50 ? 'up' : 'neutral'}
        icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
        moduleColor={MODULE_COLOR}
      />
      <StatCard
        label="Hours Tracked"
        value={`${data.total_hours.toLocaleString()}h`}
        change={`${data.billable_hours}h billable`}
        trend="neutral"
        icon={<Clock className="h-5 w-5 text-muted-foreground" />}
        moduleColor={MODULE_COLOR}
      />
      <StatCard
        label="Budget Burn"
        value={`${data.budget_burn_pct}%`}
        change={getBudgetChange(data.budget_burn_pct)}
        trend={getBudgetTrend(data.budget_burn_pct)}
        icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
        moduleColor={MODULE_COLOR}
      />
      <StatCard
        label="Overdue Tasks"
        value={String(data.overdue_count)}
        change={data.overdue_count > 0 ? `${data.overdue_count} task${data.overdue_count === 1 ? '' : 's'} past due` : 'All on track'}
        trend={data.overdue_count > 0 ? 'down' : 'up'}
        icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
        moduleColor={MODULE_COLOR}
      />
    </div>
  );
}
