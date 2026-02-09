'use client';

import { useEffect, useState } from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Badge, Button, CcdLoader, CcdSpinner } from '@ccd/ui';
import { Share2, Calendar, TrendingUp, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { AskAiButton } from '@/components/ai/ask-ai-button';
import { apiGet, apiPost } from '@/lib/api';
import type { SocialPost } from '@ccd/shared/types/social';

interface SocialStats {
  accounts: number;
  scheduled_posts: number;
  total_engagement: number;
  total_reach: number;
  engagement_rate: number;
}

interface AiInsight {
  title: string;
  content: string;
  category?: string;
  created_at?: string;
}

const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  youtube: '#FF0000',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'outline' },
  publishing: { label: 'Publishing', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function SocialDashboardPage() {
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, postsRes] = await Promise.all([
          apiGet<SocialStats>('/api/social/stats'),
          apiGet<SocialPost[]>('/api/social/posts?limit=5'),
        ]);
        setStats(statsRes.data);
        setRecentPosts(postsRes.data);
      } catch {
        // stats remain null; show defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function fetchInsights() {
    setInsightsLoading(true);
    setInsightsError('');
    try {
      const res = await apiPost<{ insights: AiInsight[] }>('/api/ai/insights', {
        category: 'social',
      });
      setInsights(res.data?.insights ?? []);
    } catch {
      setInsightsError('AI service not available. Please ensure the AI gateway is running.');
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
        title="Social Media"
        description="Social account management and engagement"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Connected Accounts"
          value={stats?.accounts?.toLocaleString() ?? '0'}
          trend="neutral"
          icon={<Share2 className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Scheduled Posts"
          value={stats?.scheduled_posts?.toLocaleString() ?? '0'}
          trend="neutral"
          icon={<Calendar className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Total Engagement"
          value={stats?.total_engagement?.toLocaleString() ?? '0'}
          trend="neutral"
          icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
        <StatCard
          label="Total Reach"
          value={stats?.total_reach?.toLocaleString() ?? '0'}
          trend="neutral"
          icon={<Eye className="h-5 w-5 text-muted-foreground" />}
          moduleColor="#F59E0B"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/social/compose">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Compose</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and schedule posts across platforms
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/social/posts">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage all your social posts
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/social/campaigns">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organise posts into marketing campaigns
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/social/engagement">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitor engagement and respond to comments
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Posts */}
      {recentPosts.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Posts</CardTitle>
            <Link href="/social/posts" className="text-sm text-muted-foreground hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPosts.map((post) => {
              const config = statusConfig[post.status];
              return (
                <div
                  key={post.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm truncate">{post.content || 'No content'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {(post.platforms ?? []).map((p) => (
                        <span
                          key={p}
                          className="inline-block px-1.5 py-0.5 rounded text-[10px] text-white font-medium"
                          style={{ backgroundColor: platformColors[p] ?? '#888' }}
                        >
                          {p}
                        </span>
                      ))}
                      {post.scheduled_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.scheduled_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">AI Insights</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInsights} disabled={insightsLoading}>
            {insightsLoading ? <CcdSpinner size="sm" /> : <Sparkles className="h-3.5 w-3.5" />}
            <span className="ml-2">{insights.length > 0 ? 'Refresh' : 'Generate'}</span>
          </Button>
        </CardHeader>
        <CardContent>
          {insightsError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{insightsError}</p>
            </div>
          )}

          {!insightsError && insightsLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <CcdSpinner size="lg" className="text-emerald-600 mb-3" />
              <p className="text-sm text-muted-foreground">Generating insights...</p>
            </div>
          )}

          {!insightsError && !insightsLoading && insights.length === 0 && (
            <div className="flex flex-col items-center py-8">
              <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground text-center">
                Click to generate AI-powered insights about your social media performance
              </p>
            </div>
          )}

          {!insightsError && !insightsLoading && insights.length > 0 && (
            <div className="space-y-4">
              {insights.map((insight, idx) => (
                <div key={idx} className="rounded-lg border p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    {insight.category && (
                      <Badge variant="secondary" className="text-xs">
                        {insight.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{insight.content}</p>
                  {insight.created_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(insight.created_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AskAiButton moduleContext="social" />
    </div>
  );
}
