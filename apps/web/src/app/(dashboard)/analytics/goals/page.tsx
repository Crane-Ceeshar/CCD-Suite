'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdLoader,
  EmptyState,
  toast,
} from '@ccd/ui';
import { Target, Plus, X } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { GoalTracker } from '@/components/analytics/goal-tracker';

interface Goal {
  id: string;
  name: string;
  description: string | null;
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
  period: string;
  status: 'active' | 'completed' | 'missed' | 'paused';
  start_date: string;
  end_date: string | null;
}

const METRIC_OPTIONS = [
  { value: 'revenue', label: 'Revenue', unit: '$' },
  { value: 'deals_won', label: 'Deals Won', unit: '' },
  { value: 'pipeline_value', label: 'Pipeline Value', unit: '$' },
  { value: 'engagement', label: 'Social Engagement', unit: '' },
  { value: 'impressions', label: 'Social Impressions', unit: '' },
  { value: 'content_count', label: 'Content Published', unit: '' },
  { value: 'audit_score', label: 'SEO Audit Score', unit: '' },
  { value: 'tracked_keywords', label: 'Tracked Keywords', unit: '' },
];

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<Goal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const [name, setName] = React.useState('');
  const [metricKey, setMetricKey] = React.useState('revenue');
  const [targetValue, setTargetValue] = React.useState('');
  const [period, setPeriod] = React.useState('30d');

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<Goal[]>('/api/analytics/goals');
      setGoals(res.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    if (!name.trim() || !targetValue) return;
    setCreating(true);
    try {
      const metric = METRIC_OPTIONS.find((m) => m.value === metricKey);
      await apiPost('/api/analytics/goals', {
        name: name.trim(),
        metric_key: metricKey,
        target_value: parseFloat(targetValue),
        unit: metric?.unit ?? '',
        period,
      });
      toast({ title: 'Goal Created', description: `"${name}" created successfully` });
      setName('');
      setTargetValue('');
      setShowForm(false);
      load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create goal',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const otherGoals = goals.filter((g) => g.status !== 'active' && g.status !== 'completed');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals"
        description="Track progress toward your key metric targets"
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Goals' },
        ]}
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showForm ? 'Cancel' : 'New Goal'}
          </Button>
        }
      />

      {/* Create Goal Form */}
      {showForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Create New Goal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Goal Name">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Q1 Revenue Target"
                />
              </FormField>
              <FormField label="Metric">
                <Select value={metricKey} onValueChange={setMetricKey}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_OPTIONS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Target Value">
                <Input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="e.g., 100000"
                />
              </FormField>
              <FormField label="Period">
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 Days</SelectItem>
                    <SelectItem value="30d">30 Days</SelectItem>
                    <SelectItem value="90d">90 Days</SelectItem>
                    <SelectItem value="ytd">Year to Date</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleCreate} disabled={creating || !name.trim() || !targetValue}>
                <Target className="mr-2 h-4 w-4" />
                Create Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Active Goals</h3>
          <GoalTracker goals={activeGoals} onRefresh={load} />
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          <GoalTracker goals={completedGoals} onRefresh={load} />
        </div>
      )}

      {/* Other Goals (missed, paused) */}
      {otherGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Other</h3>
          <GoalTracker goals={otherGoals} onRefresh={load} />
        </div>
      )}

      {/* Empty State */}
      {goals.length === 0 && !showForm && (
        <EmptyState
          icon={<Target className="h-6 w-6 text-muted-foreground" />}
          title="No Goals Yet"
          description="Set targets for your key metrics and track progress over time."
        />
      )}
    </div>
  );
}
