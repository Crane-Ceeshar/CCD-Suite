'use client';

import * as React from 'react';
import {
  PageHeader,
  StatCard,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CcdLoader,
} from '@ccd/ui';
import {
  Users,
  UserCheck,
  Building2,
  Activity,
  Server,
  Blocks,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { isOnAdminSubdomain, transformAdminHref } from '@/lib/admin-subdomain';

const MODULE_COLOR = '#DC2626';

const quickLinks = [
  { href: '/admin/users', label: 'User Management', description: 'Invite, manage roles, and deactivate users', icon: Users },
  { href: '/admin/services', label: 'Service Health', description: 'Monitor the status of all platform services', icon: Server },
  { href: '/admin/settings', label: 'Organisation Settings', description: 'Configure your tenant, modules, and features', icon: Blocks },
  { href: '/admin/ai-config', label: 'AI Configuration', description: 'Manage AI model, token budgets, and features', icon: Activity },
];

export default function AdminOverviewPage() {
  const onSubdomain = isOnAdminSubdomain();
  const toHref = (href: string) => transformAdminHref(href, onSubdomain);

  const [stats, setStats] = React.useState<{
    total_users: number;
    active_users: number;
    total_tenants: number;
    total_modules_enabled: number;
    recent_activity_count: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiGet<{
      total_users: number;
      active_users: number;
      total_tenants: number;
      total_modules_enabled: number;
      recent_activity_count: number;
    }>('/api/admin/overview')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Dashboard"
        description="System administration, user management, and service monitoring"
      />

      {/* Stats */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Users"
            value={stats?.total_users ?? 0}
            icon={<Users className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Active Users"
            value={stats?.active_users ?? 0}
            icon={<UserCheck className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Organisations"
            value={stats?.total_tenants ?? 0}
            icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
          <StatCard
            label="Activity (24h)"
            value={stats?.recent_activity_count ?? 0}
            icon={<Activity className="h-5 w-5 text-muted-foreground" />}
            moduleColor={MODULE_COLOR}
          />
        </div>
      )}

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={toHref(link.href)}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-red-200 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg p-2" style={{ backgroundColor: `${MODULE_COLOR}15` }}>
                    <link.icon className="h-5 w-5" style={{ color: MODULE_COLOR }} />
                  </div>
                  <CardTitle className="text-base">{link.label}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
