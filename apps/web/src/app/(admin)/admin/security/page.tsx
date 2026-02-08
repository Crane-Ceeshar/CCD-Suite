'use client';

import * as React from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  Badge,
  Button,
  CcdLoader,
} from '@ccd/ui';
import { ShieldAlert, LogIn, Globe, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface SecurityStats {
  logins_24h: number;
  logins_7d: number;
  logins_30d: number;
  unique_ips_24h: number;
  suspicious_count: number;
}

interface LoginEntry {
  id: string;
  action: string;
  ip_address: string | null;
  details: Record<string, unknown>;
  created_at: string;
  profiles: { full_name: string; email: string } | null;
}

interface SessionEntry {
  user_id: string;
  email: string;
  last_sign_in_at: string;
  profile: { full_name: string; email: string; user_type: string; is_active: boolean } | null;
}

const ACTION_COLORS: Record<string, string> = {
  'user.login': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  'user.logout': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'user.login_failed': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

const MODULE_COLOR = '#DC2626';

export default function AdminSecurityPage() {
  const [stats, setStats] = React.useState<SecurityStats | null>(null);
  const [logins, setLogins] = React.useState<LoginEntry[]>([]);
  const [sessions, setSessions] = React.useState<SessionEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'logins' | 'sessions'>('logins');

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, loginsRes, sessionsRes] = await Promise.all([
        apiGet<SecurityStats>('/api/admin/security'),
        apiGet<LoginEntry[]>('/api/admin/security/logins?per_page=50'),
        apiGet<SessionEntry[]>('/api/admin/security/sessions'),
      ]);
      setStats(statsRes.data);
      setLogins(
        (loginsRes as unknown as { data: LoginEntry[] }).data ?? []
      );
      setSessions(sessionsRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadAll();
    const interval = setInterval(loadAll, 60000);
    return () => clearInterval(interval);
  }, [loadAll]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Dashboard"
        description="Monitor login activity, suspicious behaviour, and active sessions"
        actions={
          <Button variant="outline" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      {loading && !stats ? (
        <div className="flex items-center justify-center py-8">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Logins (24h)"
            value={stats?.logins_24h ?? 0}
            icon={<LogIn className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Unique IPs (24h)"
            value={stats?.unique_ips_24h ?? 0}
            icon={<Globe className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Logins (7d)"
            value={stats?.logins_7d ?? 0}
            icon={<LogIn className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Suspicious Activity"
            value={stats?.suspicious_count ?? 0}
            icon={<AlertTriangle className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('logins')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logins'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Recent Logins
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sessions'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Active Sessions
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'logins' ? (
        <Card>
          <CardContent className="p-0">
            {logins.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-1">No Login Activity</p>
                <p className="text-sm text-muted-foreground">Login events will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-3">Time</th>
                    <th className="text-left font-medium p-3">User</th>
                    <th className="text-left font-medium p-3">Action</th>
                    <th className="text-left font-medium p-3">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logins.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">{log.profiles?.full_name ?? log.profiles?.email ?? 'Unknown'}</td>
                      <td className="p-3">
                        <Badge
                          variant="secondary"
                          className={ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700'}
                        >
                          {log.action.replace('user.', '')}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-xs">
                        {log.ip_address ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-1">No Active Sessions</p>
                <p className="text-sm text-muted-foreground">Active user sessions will appear here.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left font-medium p-3">User</th>
                    <th className="text-left font-medium p-3">Email</th>
                    <th className="text-left font-medium p-3">Role</th>
                    <th className="text-left font-medium p-3">Last Sign In</th>
                    <th className="text-left font-medium p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.user_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">
                        {session.profile?.full_name ?? 'Unknown'}
                      </td>
                      <td className="p-3 text-muted-foreground">{session.email}</td>
                      <td className="p-3">
                        <Badge variant="secondary">{session.profile?.user_type ?? '—'}</Badge>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {session.last_sign_in_at
                          ? new Date(session.last_sign_in_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="p-3">
                        <Badge variant={session.profile?.is_active ? 'default' : 'secondary'}>
                          {session.profile?.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground text-center">Auto-refreshes every 60 seconds</p>
    </div>
  );
}
