'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
  CcdLoader,
} from '@ccd/ui';
import { Activity, Loader2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface ActivityEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  profiles: { full_name: string; email: string; avatar_url: string | null } | null;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'user.login': { label: 'Login', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  'user.logout': { label: 'Logout', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  'user.created': { label: 'User Created', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' },
  'user.updated': { label: 'User Updated', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  'user.deactivated': { label: 'User Deactivated', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  'tenant.updated': { label: 'Tenant Updated', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  'tenant.created': { label: 'Tenant Created', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' },
  'tenant.suspended': { label: 'Tenant Suspended', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  'settings.updated': { label: 'Settings Updated', color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300' },
  'api_key.created': { label: 'API Key Created', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  'api_key.rotated': { label: 'API Key Rotated', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  'api_key.deleted': { label: 'API Key Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  'announcement.created': { label: 'Announcement Created', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  'announcement.updated': { label: 'Announcement Updated', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  'announcement.deleted': { label: 'Announcement Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  'feature_flag.created': { label: 'Flag Created', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  'feature_flag.updated': { label: 'Flag Updated', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  'feature_flag.deleted': { label: 'Flag Deleted', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

function exportToCSV(logs: ActivityEntry[]) {
  const headers = ['Time', 'User', 'Email', 'Action', 'Resource Type', 'Resource ID'];
  const rows = logs.map((log) => [
    log.created_at,
    log.profiles?.full_name ?? 'System',
    log.profiles?.email ?? '',
    log.action,
    log.resource_type,
    log.resource_id ?? '',
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminActivityPage() {
  const [logs, setLogs] = React.useState<ActivityEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');

  const loadLogs = React.useCallback(async (p: number) => {
    setLoading(true);
    try {
      let url = `/api/admin/activity?page=${p}&per_page=25`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      const res = await apiGet<ActivityEntry[]>(url);
      setLogs((res as unknown as { data: ActivityEntry[]; pagination: { total_pages: number } }).data);
      setTotalPages(
        (res as unknown as { pagination: { total_pages: number } }).pagination?.total_pages ?? 1
      );
    } catch { /* ignore */ }
    setLoading(false);
  }, [startDate, endDate]);

  React.useEffect(() => {
    loadLogs(page);
  }, [page, loadLogs]);

  async function handleExport() {
    setExporting(true);
    try {
      let url = '/api/admin/activity?page=1&per_page=100';
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      const res = await apiGet<ActivityEntry[]>(url);
      const allLogs = (res as unknown as { data: ActivityEntry[] }).data ?? [];
      exportToCSV(allLogs);
    } catch { /* ignore */ }
    setExporting(false);
  }

  function handleFilter() {
    setPage(1);
    loadLogs(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Recent user actions and system events"
        actions={
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        }
      />

      {/* Date Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleFilter}>
          Filter
        </Button>
        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">No Activity Yet</p>
            <p className="text-sm text-muted-foreground">Actions will appear here as users interact with the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-3">Time</th>
                    <th className="text-left font-medium p-3">User</th>
                    <th className="text-left font-medium p-3">Action</th>
                    <th className="text-left font-medium p-3">Resource</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const actionConfig = ACTION_LABELS[log.action] ?? {
                      label: log.action,
                      color: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 text-muted-foreground whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {log.profiles?.full_name ?? 'System'}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={actionConfig.color}>
                            {actionConfig.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {log.resource_type}
                          {log.resource_id ? ` (${log.resource_id.substring(0, 8)}...)` : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
