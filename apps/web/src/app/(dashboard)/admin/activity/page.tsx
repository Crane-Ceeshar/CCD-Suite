'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  Button,
  Badge,
} from '@ccd/ui';
import { Activity, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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
  'user.login': { label: 'Login', color: 'bg-blue-100 text-blue-700' },
  'user.logout': { label: 'Logout', color: 'bg-gray-100 text-gray-700' },
  'user.created': { label: 'User Created', color: 'bg-green-100 text-green-700' },
  'user.updated': { label: 'User Updated', color: 'bg-amber-100 text-amber-700' },
  'user.deactivated': { label: 'User Deactivated', color: 'bg-red-100 text-red-700' },
  'tenant.updated': { label: 'Tenant Updated', color: 'bg-purple-100 text-purple-700' },
  'settings.updated': { label: 'Settings Updated', color: 'bg-teal-100 text-teal-700' },
  'api_key.created': { label: 'API Key Created', color: 'bg-emerald-100 text-emerald-700' },
  'api_key.rotated': { label: 'API Key Rotated', color: 'bg-amber-100 text-amber-700' },
  'api_key.deleted': { label: 'API Key Deleted', color: 'bg-red-100 text-red-700' },
};

export default function AdminActivityPage() {
  const [logs, setLogs] = React.useState<ActivityEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const loadLogs = React.useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await apiGet<ActivityEntry[]>(
        `/api/admin/activity?page=${p}&per_page=25`
      );
      setLogs((res as unknown as { data: ActivityEntry[]; pagination: { total_pages: number } }).data);
      setTotalPages(
        (res as unknown as { pagination: { total_pages: number } }).pagination?.total_pages ?? 1
      );
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadLogs(page);
  }, [page, loadLogs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Recent user actions and system events"
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
