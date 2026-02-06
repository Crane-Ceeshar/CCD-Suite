import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle } from '@ccd/ui';
import { Search, TrendingUp, Link as LinkIcon, Shield } from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';

export default function SEODashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO"
        description="Website optimisation and digital presence management"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tracked Keywords"
          value="0"
          trend="neutral"
          icon={<Search className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
        <StatCard
          label="Avg Position"
          value="—"
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
        <StatCard
          label="Backlinks"
          value="0"
          trend="neutral"
          icon={<LinkIcon className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
        <StatCard
          label="Audit Score"
          value="—"
          change="Latest audit"
          trend="neutral"
          icon={<Shield className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/seo/projects">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage SEO projects and track domains
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/seo/keywords">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Keywords</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track keyword rankings and search volume
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/seo/audits">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Audits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Run site audits and view recommendations
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <AskAiButton moduleContext="seo" />
    </div>
  );
}
