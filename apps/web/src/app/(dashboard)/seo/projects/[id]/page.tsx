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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@ccd/ui';
import { Pencil, Search, Link as LinkIcon, Shield, ClipboardList, Sparkles } from 'lucide-react';
import { apiGet, apiDelete, apiPost } from '@/lib/api';
import { ProjectDialog } from '@/components/seo/project-dialog';
import { KeywordDialog } from '@/components/seo/keyword-dialog';
import { KeywordTable } from '@/components/seo/keyword-table';
import { BacklinksTable } from '@/components/seo/backlinks-table';
import { RecommendationsList } from '@/components/seo/recommendations-list';
import { AuditScoreGauge } from '@/components/seo/audit-score-gauge';
import type { SeoProject, SeoKeyword, SeoAudit, Backlink, SeoRecommendation, RecommendationStatus } from '@ccd/shared/types/seo';
import { useRouter } from 'next/navigation';

interface ProjectDetail extends SeoProject {
  keyword_count?: number;
  backlink_count?: number;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'outline' },
};

const auditStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  running: { label: 'Running', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Tab data
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [keywordsLoading, setKeywordsLoading] = useState(false);
  const [audits, setAudits] = useState<SeoAudit[]>([]);
  const [auditsLoading, setAuditsLoading] = useState(false);
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [backlinksLoading, setBacklinksLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<SeoRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Keyword dialog
  const [keywordDialogOpen, setKeywordDialogOpen] = useState(false);
  const [editKeyword, setEditKeyword] = useState<SeoKeyword | null>(null);

  // AI Summary state
  const [aiSummary, setAiSummary] = useState<string>('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchProject = useCallback(() => {
    setLoading(true);
    apiGet<ProjectDetail>(`/api/seo/projects/${projectId}`)
      .then((res) => setProject(res.data))
      .catch(() => setProject(null))
      .finally(() => setLoading(false));
  }, [projectId]);

  const fetchKeywords = useCallback(() => {
    setKeywordsLoading(true);
    apiGet<SeoKeyword[]>(`/api/seo/keywords?project_id=${projectId}`)
      .then((res) => setKeywords(res.data))
      .catch(() => setKeywords([]))
      .finally(() => setKeywordsLoading(false));
  }, [projectId]);

  const fetchAudits = useCallback(() => {
    setAuditsLoading(true);
    apiGet<SeoAudit[]>(`/api/seo/audits?project_id=${projectId}`)
      .then((res) => setAudits(res.data))
      .catch(() => setAudits([]))
      .finally(() => setAuditsLoading(false));
  }, [projectId]);

  const fetchBacklinks = useCallback(() => {
    setBacklinksLoading(true);
    apiGet<Backlink[]>(`/api/seo/backlinks?project_id=${projectId}`)
      .then((res) => setBacklinks(res.data))
      .catch(() => setBacklinks([]))
      .finally(() => setBacklinksLoading(false));
  }, [projectId]);

  const fetchRecommendations = useCallback(() => {
    setRecommendationsLoading(true);
    apiGet<SeoRecommendation[]>(`/api/seo/recommendations?project_id=${projectId}`)
      .then((res) => setRecommendations(res.data))
      .catch(() => setRecommendations([]))
      .finally(() => setRecommendationsLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  function handleTabChange(value: string) {
    if (value === 'keywords' && keywords.length === 0 && !keywordsLoading) fetchKeywords();
    if (value === 'audits' && audits.length === 0 && !auditsLoading) fetchAudits();
    if (value === 'backlinks' && backlinks.length === 0 && !backlinksLoading) fetchBacklinks();
    if (value === 'recommendations' && recommendations.length === 0 && !recommendationsLoading) fetchRecommendations();
  }

  function handleRecommendationStatusChange(id: string, newStatus: RecommendationStatus) {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  }

  async function handleDeleteKeyword(id: string) {
    try {
      await apiDelete(`/api/seo/keywords/${id}`);
      fetchKeywords();
    } catch {
      // silently handled
    }
  }

  async function handleDeleteBacklink(id: string) {
    try {
      await apiDelete(`/api/seo/backlinks/${id}`);
      fetchBacklinks();
    } catch {
      // silently handled
    }
  }

  async function handleGenerateAiSummary() {
    if (!project) return;
    setSummaryLoading(true);
    try {
      const res = await apiPost<{ message: { content: string } }>('/api/ai/chat', {
        content: `Generate a concise SEO health summary for this project:\n\nProject: ${project.name}\nDomain: ${project.domain}\nStatus: ${project.status}\nKeywords tracked: ${project.keyword_count ?? 0}\nBacklinks: ${project.backlink_count ?? 0}\nLatest audit score: ${project.latest_audit?.score ?? 'No audit'}\n\nProvide a brief 2-3 paragraph assessment of the project's SEO health, key strengths, areas for improvement, and suggested next steps.`,
        module_context: 'seo',
        entity_context: {
          entity_type: 'project',
          entity_id: projectId,
          entity_data: {
            name: project.name,
            domain: project.domain,
            keyword_count: project.keyword_count,
            backlink_count: project.backlink_count,
          },
        },
      });

      setAiSummary(res.data.message.content);

      // Log activity
      apiPost('/api/ai/module-context', {
        module: 'seo',
        context_type: 'project_summarized',
        context_data: {
          project_id: projectId,
          project_name: project.name,
          ai_analyzed: true,
        },
      });
    } catch {
      // AI service not available
    } finally {
      setSummaryLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <CcdLoader size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Project Not Found"
          breadcrumbs={[
            { label: 'SEO', href: '/seo' },
            { label: 'Projects', href: '/seo/projects' },
            { label: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">This project could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCfg = statusConfig[project.status];

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.name}
        description={project.domain}
        breadcrumbs={[
          { label: 'SEO', href: '/seo' },
          { label: 'Projects', href: '/seo/projects' },
          { label: project.name },
        ]}
        actions={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        }
      />

      <Tabs defaultValue="overview" onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="backlinks">Backlinks</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Badge variant={statusCfg?.variant}>{statusCfg?.label}</Badge>
                <p className="text-xs text-muted-foreground mt-2">Status</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{project.keyword_count ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Keywords</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-2xl font-bold">{project.backlink_count ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Backlinks</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex flex-col items-center">
                {project.latest_audit?.score != null ? (
                  <AuditScoreGauge score={project.latest_audit.score} size={64} />
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">--</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Audit Score</p>
              </CardContent>
            </Card>
          </div>

          {project.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.description}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Domain</span>
                <span className="font-medium">{project.domain}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-medium">{new Date(project.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            variant="outline"
            onClick={handleGenerateAiSummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? (
              <CcdLoader size="sm" className="mr-2" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
            )}
            AI Summary
          </Button>

          {aiSummary && (
            <Card className="border-emerald-200">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">AI Project Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{aiSummary}</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditKeyword(null); setKeywordDialogOpen(true); }}>
              <Search className="mr-2 h-4 w-4" />
              Add Keyword
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <KeywordTable
                keywords={keywords}
                loading={keywordsLoading}
                onEdit={(kw) => { setEditKeyword(kw); setKeywordDialogOpen(true); }}
                onDelete={handleDeleteKeyword}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4 mt-4">
          {auditsLoading ? (
            <div className="flex items-center justify-center py-12">
              <CcdLoader size="md" />
            </div>
          ) : audits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No audits for this project</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {audits.map((audit) => {
                const cfg = auditStatusConfig[audit.status];
                return (
                  <Card
                    key={audit.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => router.push(`/seo/audits/${audit.id}`)}
                  >
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        {audit.score != null && (
                          <AuditScoreGauge score={audit.score} size={50} />
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            Audit {new Date(audit.started_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {audit.pages_crawled} pages &middot; {audit.issues_count} issues
                          </p>
                        </div>
                      </div>
                      <Badge variant={cfg?.variant}>{cfg?.label}</Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="backlinks" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <BacklinksTable
                backlinks={backlinks}
                loading={backlinksLoading}
                onDelete={handleDeleteBacklink}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          {recommendationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <CcdLoader size="md" />
            </div>
          ) : (
            <RecommendationsList
              recommendations={recommendations}
              onStatusChange={handleRecommendationStatusChange}
            />
          )}
        </TabsContent>
      </Tabs>

      <ProjectDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
        onSuccess={fetchProject}
      />

      <KeywordDialog
        open={keywordDialogOpen}
        onOpenChange={setKeywordDialogOpen}
        projectId={projectId}
        keyword={editKeyword}
        onSuccess={fetchKeywords}
      />
    </div>
  );
}
