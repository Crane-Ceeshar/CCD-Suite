'use client';

import { useEffect, useState } from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Button, CcdLoader } from '@ccd/ui';
import { Search, TrendingUp, Link as LinkIcon, Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';
import { apiGet, apiPost } from '@/lib/api';
import { AuditScoreGauge } from '@/components/seo/audit-score-gauge';

interface SeoStats {
  tracked_keywords: number;
  avg_position: number | null;
  active_backlinks: number;
  latest_audit_score: number | null;
}

interface AiInsight {
  title: string;
  content: string;
}

export default function SEODashboardPage() {
  const [stats, setStats] = useState<SeoStats | null>(null);
  const [loading, setLoading] = useState(true);

  // AI Insights state
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string>('');

  useEffect(() => {
    apiGet<SeoStats>('/api/seo/stats')
      .then((res) => setStats(res.data))
      .catch(() => {
        setStats({
          tracked_keywords: 0,
          avg_position: null,
          active_backlinks: 0,
          latest_audit_score: null,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleGenerateInsights() {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await apiPost<{ insights: AiInsight[] }>('/api/ai/insights', {
        category: 'seo',
      });
      setInsights(res.data.insights);
    } catch {
      setInsightsError('AI service is not available. Please ensure the AI gateway is running.');
    } finally {
      setInsightsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO"
        description="Website optimisation and digital presence management"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tracked Keywords"
          value={String(stats?.tracked_keywords ?? 0)}
          trend="neutral"
          icon={<Search className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
        <StatCard
          label="Avg Position"
          value={stats?.avg_position != null ? stats.avg_position.toFixed(1) : '--'}
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
        <StatCard
          label="Backlinks"
          value={String(stats?.active_backlinks ?? 0)}
          trend="neutral"
          icon={<LinkIcon className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
        <StatCard
          label="Audit Score"
          value={stats?.latest_audit_score != null ? String(stats.latest_audit_score) : '--'}
          change="Latest audit"
          trend="neutral"
          icon={<Shield className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#9BBD2B"
        />
      </div>

      {stats?.latest_audit_score != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest Audit</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <AuditScoreGauge score={stats.latest_audit_score} size={100} />
            <div>
              <p className="text-sm text-muted-foreground">
                Your latest site audit scored <strong>{stats.latest_audit_score}/100</strong>.
              </p>
              <Link href="/seo/audits" className="text-sm underline" style={{ color: '#9BBD2B' }}>
                View all audits
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">AI Insights</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
          >
            {insightsLoading ? (
              <CcdLoader size="sm" className="mr-2" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
            )}
            {insights.length > 0 ? 'Refresh' : 'Generate Insights'}
          </Button>
        </CardHeader>
        <CardContent>
          {insightsError && (
            <p className="text-sm text-destructive">{insightsError}</p>
          )}
          {!insightsError && insights.length === 0 && !insightsLoading && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate Insights&quot; to get AI-powered SEO recommendations.
            </p>
          )}
          {insightsLoading && (
            <div className="flex items-center justify-center py-8">
              <CcdLoader size="md" />
            </div>
          )}
          {insights.length > 0 && (
            <div className="space-y-4">
              {insights.map((insight, i) => (
                <div key={i} className="border-l-2 border-emerald-400 pl-4">
                  <h4 className="text-sm font-medium">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{insight.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AskAiButton moduleContext="seo" />
    </div>
  );
}
