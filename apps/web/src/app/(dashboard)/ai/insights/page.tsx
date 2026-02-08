'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  CcdLoader,
} from '@ccd/ui';
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  BarChart3,
  Search,
  Wallet,
  Share2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import type { AiInsight } from '@ccd/shared';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Lightbulb },
  { id: 'crm', label: 'CRM', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'social', label: 'Social', icon: Share2 },
] as const;

const TYPE_COLORS: Record<string, string> = {
  deal_score: 'bg-blue-100 text-blue-700',
  sales_forecast: 'bg-purple-100 text-purple-700',
  anomaly_detection: 'bg-red-100 text-red-700',
  trend_narration: 'bg-amber-100 text-amber-700',
  keyword_suggestion: 'bg-green-100 text-green-700',
  expense_categorization: 'bg-teal-100 text-teal-700',
  sentiment_analysis: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700',
};

export default function InsightsPage() {
  const [insights, setInsights] = React.useState<AiInsight[]>([]);
  const [activeCategory, setActiveCategory] = React.useState('all');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setIsLoading(true);
    try {
      const res = await apiGet<AiInsight[]>('/api/ai/insights');
      setInsights(res.data);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerate(category: string) {
    setIsGenerating(true);
    try {
      await apiPost('/api/ai/insights', {
        category: category === 'all' ? 'crm' : category,
      });
      await loadInsights();
    } catch {
      // Silently fail
    } finally {
      setIsGenerating(false);
    }
  }

  const filtered =
    activeCategory === 'all'
      ? insights
      : insights.filter((i) => i.category === activeCategory);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Smart Insights"
        description="AI-generated actionable insights from your business data"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Insights' },
        ]}
        actions={
          <Button
            onClick={() => handleGenerate(activeCategory)}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Insights
              </>
            )}
          </Button>
        }
      />

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Insights grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">No insights yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Click &quot;Generate Insights&quot; to analyse your data and create actionable insights.
            </p>
            <Button
              variant="outline"
              onClick={() => handleGenerate(activeCategory)}
              disabled={isGenerating}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((insight) => (
            <Card key={insight.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{insight.title}</CardTitle>
                  <Badge
                    variant="secondary"
                    className={TYPE_COLORS[insight.type] ?? TYPE_COLORS.general}
                  >
                    {insight.type.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {insight.summary}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {insight.category}
                  </Badge>
                  <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
