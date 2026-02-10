'use client';

import * as React from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@ccd/ui';
import { ChevronLeft, ChevronRight, FileText, BarChart3, Share2, Search, Zap } from 'lucide-react';

// ── Report type definitions ─────────────────────────────────────────────────

type ReportType = 'performance' | 'content' | 'social' | 'seo' | 'custom';
type PeriodValue = '7d' | '30d' | '90d' | 'ytd';

interface ReportBuilderProps {
  onSave: (report: { name: string; report_type: string; config: object }) => void;
  onCancel: () => void;
}

const REPORT_TYPES: { value: ReportType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  { value: 'performance', label: 'Performance', description: 'Revenue, deals, pipeline, and conversion metrics', icon: <BarChart3 className="h-5 w-5" />, color: '#8B5CF6' },
  { value: 'content', label: 'Content', description: 'Content items, statuses, types, and categories', icon: <FileText className="h-5 w-5" />, color: '#EC4899' },
  { value: 'social', label: 'Social', description: 'Engagement, likes, comments, shares, and impressions', icon: <Share2 className="h-5 w-5" />, color: '#22C55E' },
  { value: 'seo', label: 'SEO', description: 'Audit scores, keyword rankings, and tracking data', icon: <Search className="h-5 w-5" />, color: '#3B82F6' },
  { value: 'custom', label: 'Custom', description: 'Pick and choose metrics from any module', icon: <Zap className="h-5 w-5" />, color: '#F59E0B' },
];

const METRICS_BY_TYPE: Record<ReportType, { key: string; label: string }[]> = {
  performance: [
    { key: 'revenue', label: 'Revenue' },
    { key: 'deals_won', label: 'Deals Won' },
    { key: 'pipeline_value', label: 'Pipeline Value' },
    { key: 'conversion_rate', label: 'Conversion Rate' },
  ],
  content: [
    { key: 'total_items', label: 'Total Items' },
    { key: 'published', label: 'Published' },
    { key: 'drafts', label: 'Drafts' },
    { key: 'by_type', label: 'By Type' },
    { key: 'by_category', label: 'By Category' },
  ],
  social: [
    { key: 'engagement', label: 'Engagement' },
    { key: 'likes', label: 'Likes' },
    { key: 'comments', label: 'Comments' },
    { key: 'shares', label: 'Shares' },
    { key: 'impressions', label: 'Impressions' },
  ],
  seo: [
    { key: 'audit_score', label: 'Audit Score' },
    { key: 'keyword_positions', label: 'Keyword Positions' },
    { key: 'tracked_keywords', label: 'Tracked Keywords' },
  ],
  custom: [
    { key: 'revenue', label: 'Revenue' },
    { key: 'deals_won', label: 'Deals Won' },
    { key: 'pipeline_value', label: 'Pipeline Value' },
    { key: 'engagement', label: 'Engagement' },
    { key: 'impressions', label: 'Impressions' },
    { key: 'audit_score', label: 'Audit Score' },
    { key: 'tracked_keywords', label: 'Tracked Keywords' },
    { key: 'total_items', label: 'Total Items' },
    { key: 'published', label: 'Published' },
  ],
};

const PERIOD_PRESETS: { value: PeriodValue; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: 'ytd', label: 'YTD' },
];

// ── Component ───────────────────────────────────────────────────────────────

export function ReportBuilder({ onSave, onCancel }: ReportBuilderProps) {
  const [step, setStep] = React.useState(1);
  const [reportType, setReportType] = React.useState<ReportType>('performance');
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([]);
  const [period, setPeriod] = React.useState<PeriodValue>('30d');
  const [reportName, setReportName] = React.useState('');

  const totalSteps = 4;

  function toggleMetric(key: string) {
    setSelectedMetrics((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  }

  function handleNext() {
    if (step < totalSteps) setStep(step + 1);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
  }

  function handleSave() {
    const name = reportName.trim() || `${reportType} report`;
    onSave({
      name,
      report_type: reportType,
      config: { metrics: selectedMetrics, period },
    });
  }

  // Reset metrics when report type changes
  React.useEffect(() => {
    setSelectedMetrics([]);
  }, [reportType]);

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return true; // type is always selected
      case 2:
        return selectedMetrics.length > 0;
      case 3:
        return true; // period always has default
      case 4:
        return true;
      default:
        return false;
    }
  };

  const currentTypeInfo = REPORT_TYPES.find((t) => t.value === reportType);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">New Report</CardTitle>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i + 1 <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Step {step} of {totalSteps}
          {step === 1 && ' - Select Report Type'}
          {step === 2 && ' - Choose Metrics'}
          {step === 3 && ' - Date Range'}
          {step === 4 && ' - Name & Review'}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ── Step 1: Report Type ─────────────────────────────────── */}
        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REPORT_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setReportType(type.value)}
                className={`relative flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-all hover:shadow-sm ${
                  reportType === type.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${type.color}20`, color: type.color }}
                >
                  {type.icon}
                </div>
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                </div>
                {reportType === type.value && (
                  <div className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Metrics ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">
              Select metrics for your{' '}
              <span style={{ color: currentTypeInfo?.color }}>{currentTypeInfo?.label}</span>{' '}
              report
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {METRICS_BY_TYPE[reportType].map((metric) => (
                <label
                  key={metric.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                    selectedMetrics.includes(metric.key)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.key)}
                    onChange={() => toggleMetric(metric.key)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{metric.label}</span>
                </label>
              ))}
            </div>
            {selectedMetrics.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedMetrics.length} metric{selectedMetrics.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {/* ── Step 3: Date Range ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Select the date range for your report</p>
            <div className="flex flex-wrap gap-2">
              {PERIOD_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={period === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 4: Name & Review ───────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="report-name">
                Report Name
              </label>
              <Input
                id="report-name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder={`${currentTypeInfo?.label ?? ''} Report`}
              />
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <p className="text-sm font-medium">Report Summary</p>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${currentTypeInfo?.color}20`, color: currentTypeInfo?.color }}
                  >
                    {currentTypeInfo?.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Metrics</span>
                  <span>{selectedMetrics.length} selected</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Period</span>
                  <span>{PERIOD_PRESETS.find((p) => p.value === period)?.label ?? period}</span>
                </div>
                <div className="pt-1">
                  <span className="text-muted-foreground text-xs">Included metrics:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedMetrics.map((m) => (
                      <Badge key={m} variant="outline" className="text-xs">
                        {METRICS_BY_TYPE[reportType].find((x) => x.key === m)?.label ?? m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            {step > 1 ? (
              <Button variant="ghost" onClick={handleBack}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            ) : (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 1 && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {step < totalSteps ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                Save Report
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
