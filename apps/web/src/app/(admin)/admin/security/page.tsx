'use client';

import * as React from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Input,
  Label,
  CcdLoader,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from '@ccd/ui';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Ban,
  Search,
  Play,
  CheckCircle2,
  XCircle,
  Activity,
  FileText,
  Shield,
  Trash2,
  Plus,
} from 'lucide-react';
import {
  useSecurityStats,
  useSecurityScore,
  useSecurityEvents,
  useResolveEvent,
  useBlockedIps,
  useBlockIp,
  useUnblockIp,
  useRunSecurityScan,
  useScanHistory,
} from '@/hooks/use-security';
import { apiGet } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const MODULE_COLOR = '#DC2626';

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  failed_login: 'Failed Login',
  brute_force: 'Brute Force',
  suspicious_request: 'Suspicious Request',
  token_abuse: 'Token Abuse',
  rate_limit_exceeded: 'Rate Limited',
  unauthorized_access: 'Unauthorized Access',
  xss_attempt: 'XSS Attempt',
  sql_injection_attempt: 'SQL Injection',
};

const SCAN_TYPE_LABELS: Record<string, string> = {
  headers: 'Headers Check',
  dependencies: 'Dependency Audit',
  permissions: 'Permission Check',
  rls: 'RLS Verification',
  full: 'Full Scan',
};

/* -------------------------------------------------------------------------- */
/*  Score Gauge                                                                */
/* -------------------------------------------------------------------------- */

function ScoreGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-500' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const bgColor =
    score >= 80 ? 'stroke-green-500' : score >= 60 ? 'stroke-yellow-500' : 'stroke-red-500';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
        <circle
          cx="50" cy="50" r="45" fill="none" strokeWidth="8"
          strokeLinecap="round"
          className={bgColor}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 1: Overview & Score                                                    */
/* -------------------------------------------------------------------------- */

function OverviewTab() {
  const { data: statsRes, isLoading: statsLoading } = useSecurityStats();
  const { data: scoreRes, isLoading: scoreLoading } = useSecurityScore();

  const stats = statsRes?.data as {
    events_24h: number;
    events_7d: number;
    blocked_ips_count: number;
    unresolved_count: number;
    last_scan?: { score: number; completed_at: string };
  } | undefined;

  const scoreData = scoreRes?.data as {
    score: number;
    breakdown: { category: string; score: number; maxScore: number; status: string }[];
  } | undefined;

  if (statsLoading || scoreLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Events (24h)"
          value={stats?.events_24h ?? 0}
          icon={<Activity className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Events (7d)"
          value={stats?.events_7d ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Blocked IPs"
          value={stats?.blocked_ips_count ?? 0}
          icon={<Ban className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Unresolved Alerts"
          value={stats?.unresolved_count ?? 0}
          icon={<ShieldAlert className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>

      {/* Score Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Security Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-2">
            <ScoreGauge score={scoreData?.score ?? 0} />
            <p className="text-sm text-muted-foreground mt-2">
              {(scoreData?.score ?? 0) >= 80
                ? 'Your security posture is strong'
                : (scoreData?.score ?? 0) >= 60
                  ? 'Room for improvement'
                  : 'Action required — critical gaps detected'}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Score Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(scoreData?.breakdown ?? []).map((item) => (
                <div key={item.category} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{item.category}</span>
                      <span className="text-muted-foreground">{item.score}/{item.maxScore}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          item.score >= item.maxScore * 0.8
                            ? 'bg-green-500'
                            : item.score >= item.maxScore * 0.5
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${(item.score / item.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 2: Threat Monitor                                                      */
/* -------------------------------------------------------------------------- */

function ThreatMonitorTab() {
  const [severity, setSeverity] = React.useState('');
  const [eventType, setEventType] = React.useState('');
  const [resolved, setResolved] = React.useState('false');

  const { data: eventsRes, isLoading } = useSecurityEvents({
    severity: severity || undefined,
    event_type: eventType || undefined,
    resolved: resolved || undefined,
    per_page: 50,
  });

  const resolveEvent = useResolveEvent();

  const events = ((eventsRes?.data as any)?.events as any[]) ?? [];

  const handleResolve = (eventId: string) => {
    resolveEvent.mutate(
      { id: eventId },
      {
        onSuccess: () => toast({ title: 'Event resolved' }),
        onError: () => toast({ title: 'Failed to resolve', variant: 'destructive' }),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_severities">All Severities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <Select value={eventType} onValueChange={setEventType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_types">All Types</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={resolved} onValueChange={setResolved}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_status">All</SelectItem>
            <SelectItem value="false">Unresolved</SelectItem>
            <SelectItem value="true">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No Security Events</h3>
            <p className="text-sm text-muted-foreground">
              No events match the current filters
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {events.map((event: any) => (
            <Card key={event.id} className={event.resolved ? 'opacity-60' : ''}>
              <CardContent className="flex items-start justify-between py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className={SEVERITY_COLORS[event.severity] ?? ''}>
                      {event.severity}
                    </Badge>
                    <Badge variant="outline">
                      {EVENT_TYPE_LABELS[event.event_type] ?? event.event_type}
                    </Badge>
                    {event.resolved && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Resolved
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {event.endpoint && <span className="font-mono text-xs">{event.endpoint}</span>}
                    {event.source_ip && <span className="ml-2">IP: {event.source_ip}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.created_at).toLocaleString()}
                    {event.details?.message && ` — ${event.details.message}`}
                  </p>
                </div>
                {!event.resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolve(event.id)}
                    disabled={resolveEvent.isPending}
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Resolve
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 3: Vulnerability Scanner                                               */
/* -------------------------------------------------------------------------- */

function ScannerTab() {
  const [scanType, setScanType] = React.useState<string>('full');
  const runScan = useRunSecurityScan();
  const { data: historyRes, isLoading: historyLoading } = useScanHistory();

  const scanHistory = (historyRes?.data as any[]) ?? [];

  const handleRunScan = () => {
    runScan.mutate(
      { scan_type: scanType as 'headers' | 'dependencies' | 'permissions' | 'rls' | 'full' },
      {
        onSuccess: () => toast({ title: 'Scan completed' }),
        onError: () => toast({ title: 'Scan failed', variant: 'destructive' }),
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Run Scan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Run Security Scan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="scan-type">Scan Type</Label>
              <Select value={scanType} onValueChange={setScanType}>
                <SelectTrigger id="scan-type" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="headers">Quick — Headers Only</SelectItem>
                  <SelectItem value="dependencies">Standard — Headers + Deps</SelectItem>
                  <SelectItem value="full">Full — All Checks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleRunScan} disabled={runScan.isPending}>
              {runScan.isPending ? (
                <CcdLoader size="sm" className="mr-2" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              {runScan.isPending ? 'Scanning...' : 'Run Scan'}
            </Button>
          </div>

          {/* Latest Scan Results */}
          {runScan.data && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <ScoreGauge score={(runScan.data as any).data?.score ?? 0} />
                <div>
                  <p className="font-medium">Scan Complete</p>
                  <p className="text-sm text-muted-foreground">
                    {((runScan.data as any).data?.findings as any[])?.length ?? 0} findings detected
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {((runScan.data as any).data?.findings as any[] ?? []).map((finding: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <Badge variant="secondary" className={SEVERITY_COLORS[finding.severity] ?? ''}>
                      {finding.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{finding.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{finding.description}</p>
                      {finding.recommendation && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Recommendation: {finding.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scan History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <CcdLoader size="md" />
            </div>
          ) : scanHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No scans have been run yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Date</th>
                  <th className="text-left font-medium p-3">Type</th>
                  <th className="text-left font-medium p-3">Score</th>
                  <th className="text-left font-medium p-3">Findings</th>
                  <th className="text-left font-medium p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {scanHistory.map((scan: any) => (
                  <tr key={scan.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(scan.started_at).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline">{SCAN_TYPE_LABELS[scan.scan_type] ?? scan.scan_type}</Badge>
                    </td>
                    <td className="p-3">
                      <span className={`font-semibold ${
                        (scan.score ?? 0) >= 80 ? 'text-green-600' : (scan.score ?? 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {scan.score ?? '—'}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {(scan.findings as any[])?.length ?? 0} issues
                    </td>
                    <td className="p-3">
                      <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'failed' ? 'destructive' : 'secondary'}>
                        {scan.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 4: Audit Report                                                        */
/* -------------------------------------------------------------------------- */

function AuditReportTab() {
  const [logs, setLogs] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [actionFilter, setActionFilter] = React.useState('');

  const loadLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: '100' });
      if (actionFilter) params.set('action', actionFilter);
      const res = await apiGet<any[]>(`/api/admin/activity?${params}`);
      setLogs(res.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [actionFilter]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_actions">All Actions</SelectItem>
            <SelectItem value="user.login">Login</SelectItem>
            <SelectItem value="user.logout">Logout</SelectItem>
            <SelectItem value="user.login_failed">Failed Login</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <CcdLoader size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-1">No Activity Logs</p>
              <p className="text-sm text-muted-foreground">Activity will appear here as users interact with the platform.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Time</th>
                  <th className="text-left font-medium p-3">User</th>
                  <th className="text-left font-medium p-3">Action</th>
                  <th className="text-left font-medium p-3">Resource</th>
                  <th className="text-left font-medium p-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">{log.profiles?.full_name ?? log.profiles?.email ?? '—'}</td>
                    <td className="p-3">
                      <Badge variant="secondary">{log.action}</Badge>
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {log.resource_type}{log.resource_id ? ` #${log.resource_id.slice(0, 8)}` : ''}
                    </td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">
                      {log.ip_address ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 5: IP Management                                                       */
/* -------------------------------------------------------------------------- */

function IpManagementTab() {
  const { data: ipsRes, isLoading } = useBlockedIps();
  const blockIp = useBlockIp();
  const unblockIp = useUnblockIp();

  const blockedIps = (ipsRes?.data as any[]) ?? [];

  const [showForm, setShowForm] = React.useState(false);
  const [newIp, setNewIp] = React.useState('');
  const [newReason, setNewReason] = React.useState('');
  const [newExpiry, setNewExpiry] = React.useState('');

  const handleBlock = () => {
    if (!newIp.trim()) return;
    blockIp.mutate(
      {
        ip_address: newIp.trim(),
        reason: newReason.trim() || undefined,
        expires_at: newExpiry || undefined,
      },
      {
        onSuccess: () => {
          toast({ title: 'IP blocked successfully' });
          setNewIp('');
          setNewReason('');
          setNewExpiry('');
          setShowForm(false);
        },
        onError: () => toast({ title: 'Failed to block IP', variant: 'destructive' }),
      }
    );
  };

  const handleUnblock = (id: string) => {
    unblockIp.mutate(id, {
      onSuccess: () => toast({ title: 'IP unblocked' }),
      onError: () => toast({ title: 'Failed to unblock', variant: 'destructive' }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Manage blocked IP addresses. Blocked IPs will receive a 403 response.
        </p>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Block IP
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="block-ip">IP Address *</Label>
                <Input
                  id="block-ip"
                  placeholder="e.g. 192.168.1.100"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-reason">Reason</Label>
                <Input
                  id="block-reason"
                  placeholder="Reason for blocking"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-expiry">Expires At</Label>
                <Input
                  id="block-expiry"
                  type="datetime-local"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleBlock} disabled={blockIp.isPending || !newIp.trim()}>
                {blockIp.isPending ? 'Blocking...' : 'Block IP'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blocked IPs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <CcdLoader size="md" />
            </div>
          ) : blockedIps.length === 0 ? (
            <div className="py-12 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium mb-1">No Blocked IPs</p>
              <p className="text-sm text-muted-foreground">
                No IP addresses are currently blocked
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">IP Address</th>
                  <th className="text-left font-medium p-3">Reason</th>
                  <th className="text-left font-medium p-3">Blocked At</th>
                  <th className="text-left font-medium p-3">Expires</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIps.map((ip: any) => (
                  <tr key={ip.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-mono font-medium">{ip.ip_address}</td>
                    <td className="p-3 text-muted-foreground">{ip.reason ?? '—'}</td>
                    <td className="p-3 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(ip.blocked_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-muted-foreground text-xs">
                      {ip.expires_at ? new Date(ip.expires_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3">
                      <Badge variant={ip.is_active ? 'destructive' : 'secondary'}>
                        {ip.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3">
                      {ip.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblock(ip.id)}
                          disabled={unblockIp.isPending}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Unblock
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab 6: Security Tests                                                      */
/* -------------------------------------------------------------------------- */

function SecurityTestsTab() {
  const testCategories = [
    { id: 'xss', name: 'XSS Prevention', description: 'Tests that all inputs strip dangerous HTML, script tags, and event handlers' },
    { id: 'sql_injection', name: 'SQL Injection', description: 'Tests that SQL injection patterns are rejected or safely handled by parameterized queries' },
    { id: 'auth', name: 'Authentication', description: 'Tests that unauthenticated requests return 401 and role-based access is enforced' },
    { id: 'tenant_isolation', name: 'Tenant Isolation', description: 'Tests that users cannot access resources belonging to other tenants' },
    { id: 'rate_limiting', name: 'Rate Limiting', description: 'Tests that rapid requests are throttled and return 429 with proper headers' },
    { id: 'csrf', name: 'CSRF Protection', description: 'Tests that cross-origin state-changing requests are rejected' },
    { id: 'session', name: 'Session Security', description: 'Tests that tampered or expired sessions are rejected' },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security Test Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Security tests run via the CI/CD pipeline. Below are the test categories and what they cover.
            Run <code className="bg-muted px-1 py-0.5 rounded text-xs">npx playwright test tests/security/</code> to execute all tests locally.
          </p>
          <div className="space-y-3">
            {testCategories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 rounded-lg border p-4">
                <Shield className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  <code className="text-xs">{cat.id}.test.ts</code>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-6 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
            <Play className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Run Tests Locally</p>
            <p className="text-sm text-muted-foreground">
              Execute the security test suite against your local development server
            </p>
          </div>
          <code className="text-xs bg-muted px-3 py-2 rounded font-mono">
            npx playwright test tests/security/
          </code>
        </CardContent>
      </Card>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                  */
/* -------------------------------------------------------------------------- */

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Dashboard"
        description="Monitor threats, manage IP blocks, run vulnerability scans, and review audit trails"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Shield className="mr-1.5 h-4 w-4 hidden sm:inline-block" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="threats" className="text-xs sm:text-sm">
            <AlertTriangle className="mr-1.5 h-4 w-4 hidden sm:inline-block" />
            Threats
          </TabsTrigger>
          <TabsTrigger value="scanner" className="text-xs sm:text-sm">
            <Search className="mr-1.5 h-4 w-4 hidden sm:inline-block" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="audit" className="text-xs sm:text-sm">
            <FileText className="mr-1.5 h-4 w-4 hidden sm:inline-block" />
            Audit
          </TabsTrigger>
          <TabsTrigger value="ips" className="text-xs sm:text-sm">
            <Ban className="mr-1.5 h-4 w-4 hidden sm:inline-block" />
            IPs
          </TabsTrigger>
          <TabsTrigger value="tests" className="text-xs sm:text-sm">
            <ShieldCheck className="mr-1.5 h-4 w-4 hidden sm:inline-block" />
            Tests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="threats">
          <ThreatMonitorTab />
        </TabsContent>

        <TabsContent value="scanner">
          <ScannerTab />
        </TabsContent>

        <TabsContent value="audit">
          <AuditReportTab />
        </TabsContent>

        <TabsContent value="ips">
          <IpManagementTab />
        </TabsContent>

        <TabsContent value="tests">
          <SecurityTestsTab />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground text-center">
        Security data refreshes automatically. Last updated: {new Date().toLocaleTimeString()}
      </p>
    </div>
  );
}
