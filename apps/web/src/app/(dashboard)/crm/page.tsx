import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { Users, Building2, DollarSign, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';

export default function CRMDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Manage your clients, deals, and sales pipeline"
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Deals"
          value="0"
          change="Pipeline value: $0"
          trend="neutral"
          icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
        <StatCard
          label="Contacts"
          value="0"
          trend="neutral"
          icon={<Users className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
        <StatCard
          label="Companies"
          value="0"
          trend="neutral"
          icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#0047AB"
        />
        <StatCard
          label="Win Rate"
          value="0%"
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

      <AskAiButton moduleContext="crm" />
    </div>
  );
}
