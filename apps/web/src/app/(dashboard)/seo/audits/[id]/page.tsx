'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  CcdLoader,
} from '@ccd/ui';
import { Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { AuditScoreGauge } from '@/components/seo/audit-score-gauge';
import { RecommendationsList } from '@/components/seo/recommendations-list';
import type { SeoAudit, SeoRecommendation, RecommendationStatus } from '@ccd/shared/types/seo';

interface AuditDetail extends SeoAudit {
  recommendations?: SeoRecommendation[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  running: { label: 'Running', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function AuditDetailPage() {
  const params = useParams();
  const auditId = params.id as string;

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [recommendations, setRecommendations] = useState<SeoRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // AI recommendations state
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');

  const fetchAudit = useCallback(() => {
    setLoading(true);
    apiGet<AuditDetail>(`/api/seo/audits/${auditId}`)
      .then((res) => {
        setAudit(res.data);
        setRecommendations(res.data.recommendations ?? []);
      })
      .catch(() => setAudit(null))
      .finally(() => setLoading(false));
  }, [auditId]);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  function handleRecommendationStatusChange(id: string, newStatus: RecommendationStatus) {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }

  async function handleGenerateAiRecommendations() {
    if (!audit) return;
    setAiGenerating(true);
    try {
      const res = await apiPost<{ message: { content: string } }>('/api/ai/chat', {
        content: `Analyze this SEO audit and provide actionable recommendations:\n\nAudit Score: ${audit.score}/100\nPages Crawled: ${audit.pages_crawled}\nIssues Found: ${audit.issues_count}\nStatus: ${audit.status}\nExisting recommendations: ${recommendations.length}\n\nProvide 5-7 specific, prioritised SEO recommendations to improve this site's score. Format each recommendation as a numbered list with a brief title and explanation.`,
        module_context: 'seo',
        entity_context: {
          entity_type: 'audit',
          entity_id: auditId,
          entity_data: {
            score: audit.score,
            pages_crawled: audit.pages_crawled,
            issues_count: audit.issues_count,
          },
        },
      });

      setAiRecommendations(res.data.message.content);

      // Log activity
      apiPost('/api/ai/module-context', {
        module: 'seo',
        context_type: 'audit_completed',
        context_data: { audit_id: auditId, score: audit.score, ai_analyzed: true },
      });
    } catch {
      // AI service not available
    } finally {
      setAiGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <CcdLoader size="lg" />
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Audit Not Found"
          breadcrumbs={[
            { label: 'SEO', href: '/seo' },
            { label: 'Audits', href: '/seo/audits' },
            { label: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">This audit could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const auditDate = new Date(audit.started_at).toLocaleDateString();
  const statusCfg = statusConfig[audit.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Audit ${auditDate}`}
        description="Site health audit results and recommendations"
        breadcrumbs={[
          { label: 'SEO', href: '/seo' },
          { label: 'Audits', href: '/seo/audits' },
          { label: `Audit ${auditDate}` },
        ]}
      />

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-8">
        {audit.score != null && (
          <AuditScoreGauge score={audit.score} size={160} />
        )}

        <div className="grid gap-4 flex-1 w-full md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{audit.pages_crawled}</p>
              <p className="text-xs text-muted-foreground mt-1">Pages Crawled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{audit.issues_count}</p>
              <p className="text-xs text-muted-foreground mt-1">Issues Found</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Badge variant={statusCfg?.variant}>{statusCfg?.label}</Badge>
              <p className="text-xs text-muted-foreground mt-2">Status</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">
                {audit.completed_at
                  ? new Date(audit.completed_at).toLocaleDateString()
                  : '--'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recommendations</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAiRecommendations}
            disabled={aiGenerating}
          >
            {aiGenerating ? (
              <CcdLoader size="sm" className="mr-2" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
            )}
            Generate AI Recommendations
          </Button>
        </CardHeader>
        <CardContent>
          <RecommendationsList
            recommendations={recommendations}
            onStatusChange={handleRecommendationStatusChange}
          />
        </CardContent>
      </Card>

      {aiRecommendations && (
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">AI Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiRecommendations}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
