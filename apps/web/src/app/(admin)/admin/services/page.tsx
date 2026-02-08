'use client';

import * as React from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, CcdLoader } from '@ccd/ui';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { apiGet } from '@/lib/api';

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency_ms: number | null;
  last_checked: string;
  detail?: string;
}

const STATUS_CONFIG = {
  healthy: { icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', dot: 'bg-green-500', label: 'Healthy' },
  degraded: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', dot: 'bg-amber-500', label: 'Degraded' },
  down: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30', dot: 'bg-red-500', label: 'Down' },
  unknown: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800/30', dot: 'bg-gray-400', label: 'Unknown' },
};

const SERVICE_LABELS: Record<string, string> = {
  'api-gateway': 'API Gateway',
  'ai-services': 'AI Services',
  'analytics-engine': 'Analytics Engine',
  'file-processor': 'File Processor',
  'realtime-gateway': 'Realtime Gateway',
  supabase: 'Supabase',
};

export default function AdminServicesPage() {
  const [services, setServices] = React.useState<ServiceHealth[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadHealth = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<ServiceHealth[]>('/api/admin/services/health');
      setServices(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, [loadHealth]);

  const healthyCount = services.filter((s) => s.status === 'healthy').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Health"
        description="Monitor the status of all platform services"
        actions={
          <Button variant="outline" onClick={loadHealth} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Summary */}
      <div className="flex items-center gap-3 text-sm">
        <span className="font-medium">{healthyCount}/{services.length} services healthy</span>
        <span className="text-muted-foreground">• Auto-refreshes every 30s</span>
      </div>

      {/* Service Cards */}
      {loading && services.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((svc) => {
            const cfg = STATUS_CONFIG[svc.status];
            const Icon = cfg.icon;
            return (
              <Card key={svc.service} className={`${cfg.bg} border`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {SERVICE_LABELS[svc.service] ?? svc.service}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
                      <span className={`text-sm font-medium ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Latency: {svc.latency_ms !== null ? `${svc.latency_ms}ms` : '—'}
                    </span>
                    <span>
                      Checked: {new Date(svc.last_checked).toLocaleTimeString()}
                    </span>
                  </div>
                  {svc.detail && (
                    <p className="text-[10px] text-muted-foreground/70 truncate" title={svc.detail}>
                      {svc.detail}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
