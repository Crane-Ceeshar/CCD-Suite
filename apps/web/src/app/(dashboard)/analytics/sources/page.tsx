'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  CcdLoader,
} from '@ccd/ui';
import {
  DollarSign,
  Share2,
  Search,
  FileText,
  BarChart3,
  ExternalLink,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────

interface DataSource {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'connected' | 'not_configured';
  count?: number;
  countLabel?: string;
  configUrl: string;
  lastSync?: string;
}

interface CrmAnalytics {
  total_deals: number;
  open_deals: number;
  won_deals: number;
  lost_deals: number;
  pipeline_value: number;
}

interface SocialAccount {
  id: string;
  platform: string;
  account_name: string;
  status: string;
}

interface SeoProject {
  id: string;
  name: string;
  domain: string;
  status: string;
}

interface ContentStats {
  total: number;
  published: number;
  drafts: number;
  scheduled: number;
  in_review: number;
  archived: number;
}

// ── Icon Background Colors ────────────────────────────────────────

const ICON_COLORS: Record<string, string> = {
  crm: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  social: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  seo: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  content: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  ga: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

// ── Helpers ───────────────────────────────────────────────────────

function statusBadge(status: DataSource['status']) {
  switch (status) {
    case 'active':
      return (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="mr-1 h-3 w-3" />
          Active
        </Badge>
      );
    case 'connected':
      return (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          <CheckCircle className="mr-1 h-3 w-3" />
          Connected
        </Badge>
      );
    case 'not_configured':
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          <XCircle className="mr-1 h-3 w-3" />
          Not Configured
        </Badge>
      );
  }
}

// ── Component ─────────────────────────────────────────────────────

export default function DataSourcesPage() {
  const [sources, setSources] = React.useState<DataSource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchStatuses = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    // Fetch all endpoints in parallel; catch individually so one failure
    // doesn't block the rest.
    const [crmResult, socialResult, seoResult, contentResult] = await Promise.allSettled([
      apiGet<CrmAnalytics>('/api/crm/analytics'),
      apiGet<SocialAccount[]>('/api/social/accounts'),
      apiGet<SeoProject[]>('/api/seo/projects'),
      apiGet<ContentStats>('/api/content/stats'),
    ]);

    // ── CRM Deals ─────────────────────────────────────────────
    const crmOk = crmResult.status === 'fulfilled';
    const crmData = crmOk ? crmResult.value.data : null;

    // ── Social Media ──────────────────────────────────────────
    const socialOk = socialResult.status === 'fulfilled';
    const socialAccounts = socialOk ? socialResult.value.data : null;
    const socialCount = Array.isArray(socialAccounts) ? socialAccounts.length : 0;

    // ── SEO Audits ────────────────────────────────────────────
    const seoOk = seoResult.status === 'fulfilled';
    const seoProjects = seoOk ? seoResult.value.data : null;
    const seoCount = Array.isArray(seoProjects) ? seoProjects.length : 0;

    // ── Content Module ────────────────────────────────────────
    const contentOk = contentResult.status === 'fulfilled';
    const contentData = contentOk ? contentResult.value.data : null;

    const now = new Date().toLocaleString();

    const dataSources: DataSource[] = [
      {
        id: 'crm',
        name: 'CRM Deals',
        description:
          'Sales pipeline, deal tracking, and revenue analytics from the built-in CRM module.',
        icon: <DollarSign className="h-5 w-5" />,
        status: 'active',
        count: crmData?.total_deals ?? 0,
        countLabel: 'deals',
        configUrl: '/settings',
        lastSync: 'Just now',
      },
      {
        id: 'social',
        name: 'Social Media',
        description:
          'Connected social platform accounts for publishing, analytics, and engagement tracking.',
        icon: <Share2 className="h-5 w-5" />,
        status: socialCount > 0 ? 'connected' : 'not_configured',
        count: socialCount > 0 ? socialCount : undefined,
        countLabel: 'accounts',
        configUrl: '/social/accounts',
        lastSync: socialCount > 0 ? now : undefined,
      },
      {
        id: 'seo',
        name: 'SEO Audits',
        description:
          'Website audit projects, keyword tracking, and search engine optimization insights.',
        icon: <Search className="h-5 w-5" />,
        status: seoCount > 0 ? 'connected' : 'not_configured',
        count: seoCount > 0 ? seoCount : undefined,
        countLabel: 'projects',
        configUrl: '/seo',
        lastSync: seoCount > 0 ? now : undefined,
      },
      {
        id: 'content',
        name: 'Content Module',
        description:
          'Internal content management system tracking articles, pages, and media assets.',
        icon: <FileText className="h-5 w-5" />,
        status: 'active',
        count: contentData?.total ?? 0,
        countLabel: 'items',
        configUrl: '/content',
        lastSync: 'Just now',
      },
      {
        id: 'ga',
        name: 'Google Analytics',
        description:
          'Website traffic, visitor behavior, and conversion data from Google Analytics 4.',
        icon: <BarChart3 className="h-5 w-5" />,
        status: 'not_configured',
        configUrl: '/settings',
      },
    ];

    setSources(dataSources);
    setLoading(false);
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  // ── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  const activeCount = sources.filter(
    (s) => s.status === 'active' || s.status === 'connected'
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Sources"
        description={`${activeCount} of ${sources.length} sources active — connect and manage your analytics data sources`}
        breadcrumbs={[
          { label: 'Analytics', href: '/analytics' },
          { label: 'Data Sources' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatuses(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh Status
          </Button>
        }
      />

      {/* ── Source Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <Card
            key={source.id}
            className="relative flex flex-col transition-shadow hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
              {/* Icon circle */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${ICON_COLORS[source.id] ?? 'bg-muted text-muted-foreground'}`}
              >
                {source.icon}
              </div>

              <div className="flex-1 space-y-1">
                <CardTitle className="text-sm font-semibold leading-tight">
                  {source.name}
                </CardTitle>
                {statusBadge(source.status)}
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-0">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {source.description}
              </p>

              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                  {source.count != null && source.countLabel ? (
                    <span className="font-medium text-foreground">
                      {source.count.toLocaleString()} {source.countLabel}
                    </span>
                  ) : (
                    <span className="italic">No data yet</span>
                  )}
                </div>
                {source.lastSync && (
                  <span title="Last synced">
                    {source.lastSync}
                  </span>
                )}
              </div>

              {/* Action */}
              <Link href={source.configUrl}>
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  Configure
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
