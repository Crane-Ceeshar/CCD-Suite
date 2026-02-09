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
import { Sparkles, CheckCircle2, XCircle, AlertTriangle, FileText, Link2, Image as ImageIcon, Heading1 } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { AuditScoreGauge } from '@/components/seo/audit-score-gauge';
import { RecommendationsList } from '@/components/seo/recommendations-list';
import type { SeoAudit, SeoRecommendation, RecommendationStatus } from '@ccd/shared/types/seo';
import type { AuditResults } from '@ccd/shared/types/seo';

interface AuditDetail extends SeoAudit {
  recommendations?: SeoRecommendation[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  running: { label: 'Running', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

// ── Helpers ────────────────────────────────────────────────────────────

function ratingColor(rating: string): string {
  if (rating === 'good') return 'text-green-400';
  if (rating === 'needs-improvement') return 'text-yellow-400';
  return 'text-red-400';
}

function ratingBg(rating: string): string {
  if (rating === 'good') return 'bg-green-500/15 text-green-400 border-green-500/30';
  if (rating === 'needs-improvement') return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/15 text-red-400 border-red-500/30';
}

function priorityBadgeClass(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-500/15 text-red-400 border-red-500/30';
    case 'high':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'medium':
      return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
    case 'low':
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
    default:
      return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }
}

function typeBadgeClass(_type: string): string {
  return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
}

function CheckIcon({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
  ) : (
    <XCircle className="h-5 w-5 text-red-400 shrink-0" />
  );
}

// ── Component ──────────────────────────────────────────────────────────

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
  const results = audit.results as AuditResults | undefined;

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

      {/* ── Overall Score + Summary Cards ──────────────────────────────── */}
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

      {/* ── Lighthouse Scores ─────────────────────────────────────────── */}
      {results?.lighthouse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lighthouse Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 justify-items-center">
              <div className="flex flex-col items-center gap-2">
                <AuditScoreGauge score={results.lighthouse.performance} size={100} />
                <span className="text-xs text-muted-foreground">Performance</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AuditScoreGauge score={results.lighthouse.seo} size={100} />
                <span className="text-xs text-muted-foreground">SEO</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AuditScoreGauge score={results.lighthouse.bestPractices} size={100} />
                <span className="text-xs text-muted-foreground">Best Practices</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <AuditScoreGauge score={results.lighthouse.accessibility} size={100} />
                <span className="text-xs text-muted-foreground">Accessibility</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Core Web Vitals ───────────────────────────────────────────── */}
      {results?.coreWebVitals && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Core Web Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* LCP */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">LCP</p>
                  <p className="text-xs text-muted-foreground">Largest Contentful Paint</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${ratingColor(results.coreWebVitals.lcpRating)}`}>
                    {(results.coreWebVitals.lcp / 1000).toFixed(2)}s
                  </span>
                  <Badge className={ratingBg(results.coreWebVitals.lcpRating)}>
                    {results.coreWebVitals.lcpRating}
                  </Badge>
                </div>
              </div>
              {/* FID */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">FID</p>
                  <p className="text-xs text-muted-foreground">First Input Delay</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${ratingColor(results.coreWebVitals.fidRating)}`}>
                    {results.coreWebVitals.fid}ms
                  </span>
                  <Badge className={ratingBg(results.coreWebVitals.fidRating)}>
                    {results.coreWebVitals.fidRating}
                  </Badge>
                </div>
              </div>
              {/* CLS */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">CLS</p>
                  <p className="text-xs text-muted-foreground">Cumulative Layout Shift</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${ratingColor(results.coreWebVitals.clsRating)}`}>
                    {results.coreWebVitals.cls.toFixed(3)}
                  </span>
                  <Badge className={ratingBg(results.coreWebVitals.clsRating)}>
                    {results.coreWebVitals.clsRating}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Meta Tags Checklist ───────────────────────────────────────── */}
      {results?.metaTags && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Meta Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Title */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <CheckIcon ok={results.metaTags.title.exists && results.metaTags.title.optimal} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Title</span>
                    {results.metaTags.title.exists && (
                      <span className="text-xs text-muted-foreground">
                        ({results.metaTags.title.length} chars)
                      </span>
                    )}
                    {results.metaTags.title.exists && !results.metaTags.title.optimal && (
                      <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px]">
                        Not Optimal
                      </Badge>
                    )}
                  </div>
                  {results.metaTags.title.value && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {results.metaTags.title.value}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <CheckIcon ok={results.metaTags.description.exists && results.metaTags.description.optimal} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Meta Description</span>
                    {results.metaTags.description.exists && (
                      <span className="text-xs text-muted-foreground">
                        ({results.metaTags.description.length} chars)
                      </span>
                    )}
                    {results.metaTags.description.exists && !results.metaTags.description.optimal && (
                      <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px]">
                        Not Optimal
                      </Badge>
                    )}
                  </div>
                  {results.metaTags.description.value && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {results.metaTags.description.value}
                    </p>
                  )}
                </div>
              </div>

              {/* Simple boolean checks */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckIcon ok={results.metaTags.ogTitle} />
                  <span className="text-sm font-medium">OG Title</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckIcon ok={results.metaTags.ogDescription} />
                  <span className="text-sm font-medium">OG Description</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckIcon ok={results.metaTags.ogImage} />
                  <span className="text-sm font-medium">OG Image</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckIcon ok={results.metaTags.canonical} />
                  <span className="text-sm font-medium">Canonical URL</span>
                </div>
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <CheckIcon ok={results.metaTags.viewport} />
                  <span className="text-sm font-medium">Viewport</span>
                </div>
                {results.metaTags.robots !== null && (
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="text-sm font-medium">Robots</span>
                      <p className="text-xs text-muted-foreground">{results.metaTags.robots}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Content Structure ─────────────────────────────────────────── */}
      {results?.contentStructure && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Heading1 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-lg font-bold">{results.contentStructure.h1Count}</p>
                  <p className="text-xs text-muted-foreground">H1 Tags</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <CheckIcon ok={results.contentStructure.headingHierarchyValid} />
                <div>
                  <p className="text-sm font-medium">
                    {results.contentStructure.headingHierarchyValid ? 'Valid' : 'Invalid'}
                  </p>
                  <p className="text-xs text-muted-foreground">Heading Hierarchy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <ImageIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-lg font-bold">
                    {results.contentStructure.totalImages}
                    {results.contentStructure.imagesMissingAlt > 0 && (
                      <span className="text-sm font-normal text-red-400 ml-1">
                        ({results.contentStructure.imagesMissingAlt} missing alt)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Images</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <Link2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-lg font-bold">
                    {results.contentStructure.internalLinks}
                    <span className="text-sm font-normal text-muted-foreground ml-1">int</span>
                    <span className="text-sm font-normal text-muted-foreground mx-1">/</span>
                    {results.contentStructure.externalLinks}
                    <span className="text-sm font-normal text-muted-foreground ml-1">ext</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Links</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Technical Checks ──────────────────────────────────────────── */}
      {results?.technical && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Technical Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <CheckIcon ok={results.technical.https} />
                <div>
                  <p className="text-sm font-medium">HTTPS</p>
                  <p className="text-xs text-muted-foreground">
                    {results.technical.https ? 'Secure connection' : 'Not using HTTPS'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <CheckIcon ok={results.technical.robotsTxt} />
                <div>
                  <p className="text-sm font-medium">robots.txt</p>
                  <p className="text-xs text-muted-foreground">
                    {results.technical.robotsTxt ? 'Found' : 'Not found'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <CheckIcon ok={results.technical.sitemap} />
                <div>
                  <p className="text-sm font-medium">sitemap.xml</p>
                  <p className="text-xs text-muted-foreground">
                    {results.technical.sitemap ? 'Found' : 'Not found'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Issues List ───────────────────────────────────────────────── */}
      {results?.issues && results.issues.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <CardTitle className="text-base">
                Issues ({results.issues.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Badge className={priorityBadgeClass(issue.priority)}>
                      {issue.priority}
                    </Badge>
                    <Badge className={typeBadgeClass(issue.type)}>
                      {issue.type}
                    </Badge>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {issue.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recommendations ───────────────────────────────────────────── */}
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
