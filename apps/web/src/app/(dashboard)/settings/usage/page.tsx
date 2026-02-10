'use client';

import * as React from 'react';
import { StatCard, toast } from '@ccd/ui';
import {
  FileText,
  Briefcase,
  ImageIcon,
  Users,
  BarChart3,
  Globe,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { apiGet } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────

interface UsageData {
  content_items: number;
  deals: number;
  content_assets: number;
  team_members: number;
  metrics: number;
  integrations: number;
}

// ── Stat definitions ────────────────────────────────────────────────

const STAT_CONFIG = [
  { key: 'content_items' as const, label: 'Content Items', icon: FileText, color: '#8B5CF6' },
  { key: 'deals' as const, label: 'CRM Deals', icon: Briefcase, color: '#3B82F6' },
  { key: 'content_assets' as const, label: 'Media Assets', icon: ImageIcon, color: '#F59E0B' },
  { key: 'team_members' as const, label: 'Team Members', icon: Users, color: '#22C55E' },
  { key: 'metrics' as const, label: 'Metrics Tracked', icon: BarChart3, color: '#EC4899' },
  { key: 'integrations' as const, label: 'Integrations', icon: Globe, color: '#06B6D4' },
];

// ── Page ───────────────────────────────────────────────────────────

export default function UsageDashboardPage() {
  const [data, setData] = React.useState<UsageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchUsage() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await apiGet<UsageData>('/api/settings/usage');
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load usage data';
          setErrorMsg(msg);
          toast({ title: 'Error', description: msg, variant: 'destructive' });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUsage();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Workspace Usage</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of your workspace resource usage
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center justify-center py-16 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm">{errorMsg}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STAT_CONFIG.map((stat) => {
            const Icon = stat.icon;
            const value = data?.[stat.key] ?? 0;

            return (
              <StatCard
                key={stat.key}
                label={stat.label}
                value={value.toLocaleString()}
                icon={<Icon className="h-5 w-5" style={{ color: stat.color }} />}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
