'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  UserAvatar,
  CcdLoader,
  EmptyState,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@ccd/ui';
import {
  ScrollText,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_avatar: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface AuditLogResponse {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'user.login', label: 'User Login' },
  { value: 'user.logout', label: 'User Logout' },
  { value: 'user.created', label: 'User Created' },
  { value: 'user.updated', label: 'User Updated' },
  { value: 'user.deactivated', label: 'User Deactivated' },
  { value: 'tenant.updated', label: 'Tenant Updated' },
  { value: 'module.enabled', label: 'Module Enabled' },
  { value: 'module.disabled', label: 'Module Disabled' },
  { value: 'api_key.created', label: 'API Key Created' },
  { value: 'api_key.rotated', label: 'API Key Rotated' },
  { value: 'api_key.deleted', label: 'API Key Deleted' },
  { value: 'settings.updated', label: 'Settings Updated' },
  { value: 'settings.exported', label: 'Settings Exported' },
  { value: 'settings.imported', label: 'Settings Imported' },
  { value: 'webhook.created', label: 'Webhook Created' },
  { value: 'webhook.updated', label: 'Webhook Updated' },
  { value: 'webhook.deleted', label: 'Webhook Deleted' },
  { value: 'webhook.tested', label: 'Webhook Tested' },
  { value: 'custom_field.created', label: 'Custom Field Created' },
  { value: 'custom_field.updated', label: 'Custom Field Updated' },
  { value: 'custom_field.deleted', label: 'Custom Field Deleted' },
];

const RESOURCE_TYPE_OPTIONS = [
  { value: '', label: 'All Resources' },
  { value: 'system_settings', label: 'System Settings' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'custom_field', label: 'Custom Field' },
  { value: 'user', label: 'User' },
  { value: 'tenant', label: 'Tenant' },
];

const LIMIT = 25;

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function formatActionLabel(action: string): string {
  return action
    .split('.')
    .map((part) => part.replace(/_/g, ' '))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' / ');
}

/* -------------------------------------------------------------------------- */
/*  Details Diff Component                                                     */
/* -------------------------------------------------------------------------- */

function SettingsChangeDiff({ details }: { details: Record<string, unknown> }) {
  const [expanded, setExpanded] = React.useState(false);
  const changes = details.changes as Record<string, { old: unknown; new: unknown }> | undefined;
  const moduleName = details.module as string | undefined;
  const settingKey = details.key as string | undefined;

  if (!changes) {
    return (
      <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
        {JSON.stringify(details).slice(0, 80)}
        {JSON.stringify(details).length > 80 ? '...' : ''}
      </span>
    );
  }

  const changeEntries = Object.entries(changes);

  return (
    <div className="text-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
        <span>
          {moduleName && settingKey ? `${moduleName}.${settingKey}` : ''} ({changeEntries.length} change
          {changeEntries.length !== 1 ? 's' : ''})
        </span>
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-1 pl-4 border-l-2 border-muted">
          {changeEntries.map(([field, values]) => (
            <div key={field} className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-foreground">{field}:</span>
              <span className="text-destructive line-through">
                {String(values.old ?? 'null')}
              </span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="text-emerald-600">
                {String(values.new ?? 'null')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Details Cell                                                               */
/* -------------------------------------------------------------------------- */

function DetailsCell({
  action,
  details,
}: {
  action: string;
  details: Record<string, unknown>;
}) {
  if (action === 'settings.updated' && details.changes) {
    return <SettingsChangeDiff details={details} />;
  }

  const text = JSON.stringify(details);
  if (text === '{}') {
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  return (
    <span className="text-xs text-muted-foreground truncate max-w-[200px] block">
      {text.slice(0, 80)}
      {text.length > 80 ? '...' : ''}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function AuditLogPage() {
  const [logs, setLogs] = React.useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [filters, setFilters] = React.useState({
    action: '',
    resource_type: '',
    from: '',
    to: '',
    search: '',
  });
  const [activeQuickFilter, setActiveQuickFilter] = React.useState('all');
  const [exporting, setExporting] = React.useState(false);

  /* ---------------------------------------------------------------------- */
  /*  Data loading                                                          */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('limit', String(LIMIT));
        if (filters.action) params.set('action', filters.action);
        if (filters.resource_type) params.set('resource_type', filters.resource_type);
        if (filters.from) params.set('from', filters.from);
        if (filters.to) params.set('to', filters.to);
        if (filters.search) params.set('search', filters.search);

        const res = await apiGet<AuditLogResponse>(
          `/api/settings/audit-log?${params.toString()}`
        );

        if (cancelled) return;
        setLogs(res.data.logs);
        setTotalCount(res.data.total);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load audit log',
            description: 'Please refresh the page and try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, filters]);

  /* ---------------------------------------------------------------------- */
  /*  Quick filters                                                         */
  /* ---------------------------------------------------------------------- */

  function applyQuickFilter(key: string) {
    setActiveQuickFilter(key);
    setPage(1);
    if (key === 'all') {
      setFilters({ action: '', resource_type: '', from: '', to: '', search: '' });
    } else if (key === 'settings') {
      setFilters((prev) => ({ ...prev, action: 'settings.updated' }));
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Filter changes                                                        */
  /* ---------------------------------------------------------------------- */

  function updateFilter(key: keyof typeof filters, value: string) {
    setActiveQuickFilter('');
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  /* ---------------------------------------------------------------------- */
  /*  CSV Export                                                            */
  /* ---------------------------------------------------------------------- */

  async function handleExportCSV() {
    setExporting(true);
    try {
      // Export current filtered data
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', '1000');
      if (filters.action) params.set('action', filters.action);
      if (filters.resource_type) params.set('resource_type', filters.resource_type);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      if (filters.search) params.set('search', filters.search);

      const res = await apiGet<AuditLogResponse>(
        `/api/settings/audit-log?${params.toString()}`
      );

      const rows = res.data.logs.map((log) => [
        log.created_at,
        log.user_name || 'System',
        log.action,
        log.resource_type,
        log.resource_id || '',
        JSON.stringify(log.details),
        log.ip_address || '',
      ]);

      const header = ['timestamp', 'user', 'action', 'resource_type', 'resource_id', 'details', 'ip_address'];
      const csv = [header, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: 'Export complete', description: 'Audit log exported as CSV.' });
    } catch {
      toast({
        title: 'Export failed',
        description: 'Could not export audit log.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Pagination                                                            */
  /* ---------------------------------------------------------------------- */

  const totalPages = Math.max(1, Math.ceil(totalCount / LIMIT));

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Audit Log
              </CardTitle>
              <CardDescription>
                Track all changes and activity across your organization
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={exporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <Input
              type="date"
              value={filters.from}
              onChange={(e) => updateFilter('from', e.target.value)}
              className="w-[150px]"
              placeholder="From"
            />
            <Input
              type="date"
              value={filters.to}
              onChange={(e) => updateFilter('to', e.target.value)}
              className="w-[150px]"
              placeholder="To"
            />
            <Select
              value={filters.action}
              onValueChange={(v) => updateFilter('action', v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Actions</SelectItem>
                {ACTION_OPTIONS.filter((o) => o.value).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.resource_type}
              onValueChange={(v) => updateFilter('resource_type', v === '__all__' ? '' : v)}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="All Resources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Resources</SelectItem>
                {RESOURCE_TYPE_OPTIONS.filter((o) => o.value).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search actions..."
              className="w-[200px]"
            />
          </div>

          {/* Quick filters */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyQuickFilter('all')}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeQuickFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => applyQuickFilter('settings')}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeQuickFilter === 'settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Settings Changes
            </button>
          </div>

          {/* Table */}
          {logs.length === 0 ? (
            <EmptyState
              icon={<ScrollText className="h-5 w-5 text-muted-foreground" />}
              title="No audit log entries"
              description="Activity will appear here as changes are made to your organization settings."
              className="min-h-[200px]"
            />
          ) : (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <TooltipProvider>
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors bg-muted/30">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Time
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          User
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Action
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Resource
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Details
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          IP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {logs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          {/* Time */}
                          <td className="p-4 align-middle whitespace-nowrap">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm text-muted-foreground cursor-default">
                                  {formatRelativeTime(log.created_at)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                {new Date(log.created_at).toISOString()}
                              </TooltipContent>
                            </Tooltip>
                          </td>

                          {/* User */}
                          <td className="p-4 align-middle">
                            {log.user_id ? (
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  name={log.user_name || 'User'}
                                  imageUrl={log.user_avatar}
                                  size="sm"
                                />
                                <span className="text-sm font-medium truncate max-w-[120px]">
                                  {log.user_name || 'User'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">
                                System
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="text-xs">
                              {formatActionLabel(log.action)}
                            </Badge>
                          </td>

                          {/* Resource */}
                          <td className="p-4 align-middle">
                            <div className="text-sm">
                              <span className="text-foreground">
                                {log.resource_type.replace(/_/g, ' ')}
                              </span>
                              {log.resource_id && (
                                <span className="text-muted-foreground text-xs ml-1 truncate max-w-[80px] inline-block align-bottom">
                                  {log.resource_id.length > 12
                                    ? `${log.resource_id.slice(0, 12)}...`
                                    : log.resource_id}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Details */}
                          <td className="p-4 align-middle">
                            <DetailsCell
                              action={log.action}
                              details={log.details}
                            />
                          </td>

                          {/* IP */}
                          <td className="p-4 align-middle">
                            <span className="text-xs font-mono text-muted-foreground">
                              {log.ip_address || '-'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalCount > LIMIT && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * LIMIT + 1}&ndash;
                {Math.min(page * LIMIT, totalCount)} of {totalCount} entries
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
