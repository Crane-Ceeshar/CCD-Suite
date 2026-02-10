'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  CcdLoader,
  EmptyState,
  ConfirmationDialog,
  toast,
} from '@ccd/ui';
import { Plus, FileBarChart, Download, Play, Trash2, FileText, BarChart3, Share2, Search, Clock } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { formatDate } from '@ccd/shared';
import { ReportBuilder } from '@/components/analytics/report-builder';

// ── Types ───────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  name: string;
  report_type: string;
  config: { metrics?: string[]; period?: string };
  last_run_at: string | null;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  performance: '#8B5CF6',
  content: '#EC4899',
  social: '#22C55E',
  seo: '#3B82F6',
  custom: '#F59E0B',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  performance: <BarChart3 className="h-4 w-4" />,
  content: <FileText className="h-4 w-4" />,
  social: <Share2 className="h-4 w-4" />,
  seo: <Search className="h-4 w-4" />,
  custom: <FileBarChart className="h-4 w-4" />,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

async function downloadExport(report: Report, format: 'csv' | 'json') {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Get auth token from supabase client for the fetch call
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    headers['Authorization'] = `Bearer ${data.session.access_token}`;
  }

  const res = await fetch('/api/analytics/reports/export', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      report_id: report.id,
      report_type: report.report_type,
      config: {
        metrics: report.config?.metrics ?? [],
        period: report.config?.period ?? '30d',
      },
      format,
    }),
  });

  if (!res.ok) {
    throw new Error('Export failed');
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${report.report_type}-${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Page Component ──────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reports, setReports] = React.useState<Report[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showBuilder, setShowBuilder] = React.useState(false);
  const [exportingId, setExportingId] = React.useState<string | null>(null);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [schedulingId, setSchedulingId] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<Report[]>('/api/analytics/reports');
      setReports(res.data ?? []);
    } catch {
      /* handled */
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  async function handleSaveReport(report: { name: string; report_type: string; config: object }) {
    try {
      await apiPost('/api/analytics/reports', report);
      toast({ title: 'Report Created', description: `"${report.name}" saved successfully` });
      setShowBuilder(false);
      load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create report',
        variant: 'destructive',
      });
    }
  }

  async function handleRun(report: Report) {
    setRunningId(report.id);
    try {
      // Re-run by updating last_run_at through a re-save with same data
      await apiPost('/api/analytics/reports', {
        name: report.name,
        report_type: report.report_type,
        config: report.config,
      });
      toast({ title: 'Report Run', description: `"${report.name}" executed successfully` });
      load();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to run report',
        variant: 'destructive',
      });
    } finally {
      setRunningId(null);
    }
  }

  async function handleExport(report: Report, format: 'csv' | 'json') {
    setExportingId(report.id);
    try {
      await downloadExport(report, format);
      toast({ title: 'Exported', description: `Report downloaded as ${format.toUpperCase()}` });
    } catch {
      toast({
        title: 'Export Failed',
        description: 'Could not generate export file',
        variant: 'destructive',
      });
    } finally {
      setExportingId(null);
    }
  }

  async function handleSchedule(report: Report) {
    setSchedulingId(report.id);
    try {
      // Simple weekly schedule — a more complex UI could be added later
      await apiPost('/api/analytics/reports/schedule', {
        report_id: report.id,
        frequency: 'weekly',
        recipients: [], // Will use current user's email
        time: '09:00',
      });
      toast({
        title: 'Scheduled',
        description: `"${report.name}" will be sent weekly at 9am`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to schedule',
        variant: 'destructive',
      });
    } finally {
      setSchedulingId(null);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/analytics/reports/${id}`);
      toast({ title: 'Deleted', description: 'Report deleted' });
      load();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive',
      });
    }
  }

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
        title="Reports"
        description="Generate and export detailed analytics reports"
        breadcrumbs={[{ label: 'Analytics', href: '/analytics' }, { label: 'Reports' }]}
      />

      {/* Actions bar */}
      <div className="flex justify-end">
        <Button onClick={() => setShowBuilder(!showBuilder)}>
          <Plus className="mr-2 h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Report Builder */}
      {showBuilder && (
        <ReportBuilder
          onSave={handleSaveReport}
          onCancel={() => setShowBuilder(false)}
        />
      )}

      {/* Report List */}
      {reports.length === 0 && !showBuilder ? (
        <EmptyState
          icon={<FileBarChart className="h-6 w-6 text-muted-foreground" />}
          title="No Reports Yet"
          description="Create your first report to start generating analytics exports. Reports can be exported as CSV or JSON."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reports.map((report) => {
            const color = TYPE_COLORS[report.report_type] ?? '#6B7280';
            const icon = TYPE_ICONS[report.report_type] ?? <FileBarChart className="h-4 w-4" />;
            const isExporting = exportingId === report.id;
            const isRunning = runningId === report.id;
            const isScheduling = schedulingId === report.id;

            return (
              <Card key={report.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <span style={{ color }}>{icon}</span>
                        {report.name}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {report.report_type}
                      </Badge>
                    </div>
                    <ConfirmationDialog
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      }
                      title="Delete Report"
                      description={`Are you sure you want to delete "${report.name}"? This action cannot be undone.`}
                      confirmLabel="Delete"
                      variant="destructive"
                      onConfirm={() => handleDelete(report.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {report.last_run_at && (
                      <p>Last run: {formatDate(report.last_run_at)}</p>
                    )}
                    <p>Created: {formatDate(report.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleRun(report)}
                      disabled={isRunning}
                    >
                      <Play className="mr-1 h-3 w-3" />
                      {isRunning ? 'Running...' : 'Run'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleExport(report, 'csv')}
                      disabled={isExporting}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleExport(report, 'json')}
                      disabled={isExporting}
                    >
                      <Download className="mr-1 h-3 w-3" />
                      JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleSchedule(report)}
                      disabled={isScheduling}
                    >
                      <Clock className="mr-1 h-3 w-3" />
                      {isScheduling ? 'Scheduling...' : 'Schedule'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
