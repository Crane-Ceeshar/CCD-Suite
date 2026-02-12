'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import {
  Zap,
  Tags,
  Search,
  MessageSquare,
  Target,
  PenTool,
  AlertCircle,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useAiAutomations,
  useToggleAutomation,
  useCreateAutomation,
  useAutomationRuns,
  useTriggerRun,
} from '@/hooks/use-ai';
import { apiPatch } from '@/lib/api';
import type { AiAutomation } from '@ccd/shared';

const AUTOMATION_TEMPLATES = [
  {
    type: 'expense_categorization',
    name: 'Expense Categorisation',
    description:
      'Automatically categorise new expenses using AI based on description, vendor, and amount patterns.',
    icon: Tags,
    module: 'Finance',
  },
  {
    type: 'seo_recommendations',
    name: 'SEO Recommendations',
    description:
      'Generate weekly SEO improvement suggestions based on keyword rankings, traffic data, and competitor analysis.',
    icon: Search,
    module: 'SEO',
  },
  {
    type: 'sentiment_analysis',
    name: 'Sentiment Analysis',
    description:
      'Analyse social media comments and messages to track brand sentiment and flag negative trends.',
    icon: MessageSquare,
    module: 'Social',
  },
  {
    type: 'deal_scoring',
    name: 'Deal Scoring',
    description:
      'Score CRM deals based on engagement history, deal size, timeline, and similar deal outcomes.',
    icon: Target,
    module: 'CRM',
  },
  {
    type: 'content_suggestions',
    name: 'Content Suggestions',
    description:
      'Suggest blog topics, social media posts, and marketing campaigns based on trending topics and audience data.',
    icon: PenTool,
    module: 'Content',
  },
];

const SCHEDULE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const RUN_STATUS_STYLES: Record<string, { icon: React.ElementType; className: string }> = {
  running: { icon: CcdSpinner, className: 'text-blue-600' },
  completed: { icon: CheckCircle2, className: 'text-emerald-600' },
  failed: { icon: XCircle, className: 'text-red-600' },
};

function RunHistory({ automationId }: { automationId: string }) {
  const { runs, isLoading } = useAutomationRuns(automationId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-3">
        <CcdSpinner size="sm" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-2 text-center">
        No runs yet
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {runs.map((run) => {
        const statusConfig = RUN_STATUS_STYLES[run.status] ?? RUN_STATUS_STYLES.completed;
        const StatusIcon = statusConfig.icon;
        return (
          <div
            key={run.id}
            className="flex items-center justify-between text-xs rounded-md bg-muted/50 px-2.5 py-1.5"
          >
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`h-3 w-3 ${statusConfig.className}`} />
              <span className="capitalize">{run.status}</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              {run.items_processed > 0 && (
                <span>{run.items_processed} items</span>
              )}
              {run.tokens_used > 0 && (
                <span>{run.tokens_used.toLocaleString()} tokens</span>
              )}
              <span>{new Date(run.started_at).toLocaleDateString()}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AutomationsPage() {
  const { automations, isLoading, error, reload, setAutomations } = useAiAutomations();
  const { toggle, isToggling } = useToggleAutomation();
  const { create, isCreating } = useCreateAutomation();
  const { trigger, isTriggering } = useTriggerRun();
  const [initializing, setInitializing] = React.useState(false);
  const [expandedCard, setExpandedCard] = React.useState<string | null>(null);

  // Build a map of existing automations by type
  const automationMap = React.useMemo(() => {
    const map: Record<string, AiAutomation> = {};
    for (const a of automations) {
      map[a.type] = a;
    }
    return map;
  }, [automations]);

  // Initialize missing automations on first load
  React.useEffect(() => {
    if (isLoading || initializing) return;

    const missing = AUTOMATION_TEMPLATES.filter((t) => !automationMap[t.type]);
    if (missing.length === 0) return;

    setInitializing(true);
    Promise.all(
      missing.map((t) =>
        create({
          type: t.type,
          name: t.name,
          description: t.description,
          is_enabled: false,
        })
      )
    )
      .then(() => reload())
      .finally(() => setInitializing(false));
  }, [isLoading, automationMap, initializing, create, reload]);

  async function handleToggle(type: string) {
    const existing = automationMap[type];
    if (!existing) return;

    const result = await toggle(existing.id, !existing.is_enabled);
    if (result) {
      setAutomations(
        automations.map((a) => (a.id === existing.id ? { ...a, is_enabled: result.is_enabled } : a))
      );
    }
  }

  async function handleScheduleChange(automationId: string, scheduleType: string) {
    try {
      await apiPatch(`/api/ai/automations/${automationId}`, {
        schedule_type: scheduleType,
      });
      await reload();
    } catch { /* ignore */ }
  }

  async function handleRunNow(automationId: string) {
    const run = await trigger(automationId);
    if (run) {
      // Refresh to show the run in the list
      await reload();
    }
  }

  if (isLoading || initializing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Automations"
          description="Configure AI-powered automations to streamline your workflows"
          breadcrumbs={[
            { label: 'AI', href: '/ai' },
            { label: 'Automations' },
          ]}
        />
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Automations"
        description="Configure AI-powered automations to streamline your workflows"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Automations' },
        ]}
      />

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AUTOMATION_TEMPLATES.map((template) => {
          const existing = automationMap[template.type];
          const isEnabled = existing?.is_enabled ?? false;
          const isTogglingThis = isToggling === existing?.id;
          const isRunningThis = isTriggering === existing?.id;
          const isExpanded = expandedCard === template.type;

          return (
            <Card
              key={template.type}
              className={`transition-all ${isEnabled ? 'border-emerald-300 shadow-sm' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: isEnabled ? '#10B98115' : '#f1f5f9',
                      }}
                    >
                      <template.icon
                        className="h-5 w-5"
                        style={{ color: isEnabled ? '#10B981' : '#94a3b8' }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">{template.module}</span>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    role="switch"
                    aria-checked={isEnabled}
                    disabled={isTogglingThis || !existing}
                    onClick={() => handleToggle(template.type)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                      isEnabled ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{template.description}</p>

                {/* Schedule selector */}
                {existing && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <select
                      value={existing.schedule_type ?? 'manual'}
                      onChange={(e) => handleScheduleChange(existing.id, e.target.value)}
                      className="text-xs rounded border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {SCHEDULE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {existing && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs ml-auto"
                        disabled={isRunningThis}
                        onClick={() => handleRunNow(existing.id)}
                      >
                        {isRunningThis ? (
                          <CcdSpinner size="sm" className="mr-1" />
                        ) : (
                          <Play className="h-3 w-3 mr-1" />
                        )}
                        Run Now
                      </Button>
                    )}
                  </div>
                )}

                {isEnabled && (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <Zap className="h-3.5 w-3.5" />
                    Active
                    {existing?.schedule_type && existing.schedule_type !== 'manual' && (
                      <span> — runs {existing.schedule_type}</span>
                    )}
                  </div>
                )}

                {existing?.last_run_at && (
                  <div className="text-xs text-muted-foreground">
                    Last run: {new Date(existing.last_run_at).toLocaleDateString()}
                  </div>
                )}

                {/* Expandable run history */}
                {existing && (
                  <div className="border-t pt-2">
                    <button
                      onClick={() => setExpandedCard(isExpanded ? null : template.type)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                      Run History
                    </button>
                    {isExpanded && (
                      <div className="mt-2">
                        <RunHistory automationId={existing.id} />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
