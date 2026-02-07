'use client';

import * as React from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { Users, Building2, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import { CrmSearch } from '@/components/crm/crm-search';

interface CrmStats {
  deals: number;
  pipeline_value: number;
  contacts: number;
  companies: number;
  win_rate: number;
}

export default function CRMDashboardPage() {
  const [stats, setStats] = React.useState<CrmStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<CrmStats>('/api/crm/stats');
        setStats(res.data);
      } catch {
        setStats({ deals: 0, pipeline_value: 0, contacts: 0, companies: 0, win_rate: 0 });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Manage your clients, deals, and sales pipeline"
      />

      {/* Global Search */}
      <div className="max-w-lg">
        <CrmSearch />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Deals"
          value={loading ? '...' : String(stats?.deals ?? 0)}
          change={`Pipeline value: $${(stats?.pipeline_value ?? 0).toLocaleString()}`}
          trend="neutral"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
        <StatCard
          label="Contacts"
          value={loading ? '...' : String(stats?.contacts ?? 0)}
          trend="neutral"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
        <StatCard
          label="Companies"
          value={loading ? '...' : String(stats?.companies ?? 0)}
          trend="neutral"
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
        <StatCard
          label="Win Rate"
          value={loading ? '...' : `${stats?.win_rate ?? 0}%`}
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/crm/pipeline">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Sales Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Visualise and manage your deals across pipeline stages
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/crm/contacts">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage your client and prospect contacts
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/crm/companies">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track organisations and business relationships
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
