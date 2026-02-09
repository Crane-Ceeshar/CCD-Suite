'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  CcdLoader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ccd/ui';
import { Plus, Search, Sparkles } from 'lucide-react';
import { apiGet, apiDelete, apiPost } from '@/lib/api';
import { KeywordDialog } from '@/components/seo/keyword-dialog';
import { KeywordTable } from '@/components/seo/keyword-table';
import type { SeoKeyword, SeoProject } from '@ccd/shared/types/seo';

interface ModuleContext {
  context_type: string;
  context_data: Record<string, unknown>;
  created_at: string;
}

export default function SEOKeywordsPage() {
  const [keywords, setKeywords] = useState<SeoKeyword[]>([]);
  const [projects, setProjects] = useState<SeoProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editKeyword, setEditKeyword] = useState<SeoKeyword | null>(null);

  // AI suggestion state
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // AI learning context
  const activityContextRef = useRef<string>('');

  const fetchKeywords = useCallback(() => {
    setLoading(true);
    const params = selectedProjectId !== 'all' ? `?project_id=${selectedProjectId}` : '';
    apiGet<SeoKeyword[]>(`/api/seo/keywords${params}`)
      .then((res) => setKeywords(res.data))
      .catch(() => setKeywords([]))
      .finally(() => setLoading(false));
  }, [selectedProjectId]);

  useEffect(() => {
    apiGet<SeoProject[]>('/api/seo/projects')
      .then((res) => setProjects(res.data))
      .catch(() => setProjects([]));

    // Fetch recent SEO activity context for AI learning
    apiGet<ModuleContext[]>('/api/ai/module-context?module=seo&limit=15')
      .then((res) => {
        const activities = res.data;
        if (activities && activities.length > 0) {
          const keywordActivities = activities.filter((a) => a.context_type === 'keyword_added');
          const auditActivities = activities.filter((a) => a.context_type === 'audit_completed');
          const parts: string[] = [];
          if (keywordActivities.length > 0) {
            parts.push(`The user has added ${keywordActivities.length} keywords recently via AI suggestions`);
          }
          if (auditActivities.length > 0) {
            const scores = auditActivities
              .map((a) => a.context_data?.score as number)
              .filter((s) => s != null);
            if (scores.length > 0) {
              const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
              parts.push(`their recent audit scores average ${avgScore}/100`);
            }
          }
          if (parts.length > 0) {
            activityContextRef.current = `Context from user's SEO activity: ${parts.join(', ')}. Suggest keywords that could help improve their rankings.`;
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  function handleAdd() {
    setEditKeyword(null);
    setDialogOpen(true);
  }

  function handleEdit(kw: SeoKeyword) {
    setEditKeyword(kw);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/seo/keywords/${id}`);
      fetchKeywords();
    } catch {
      // Error handled silently
    }
  }

  async function handleSuggestKeywords() {
    setSuggesting(true);
    try {
      const existingKeywordsContext =
        keywords.length > 0
          ? `The site already tracks these keywords: ${keywords.slice(0, 10).map((k) => k.keyword).join(', ')}. Suggest related but different keywords.`
          : 'This is a new project with no keywords yet.';

      let prompt = `Suggest 10 high-value SEO keywords for a website. ${existingKeywordsContext}`;
      // Add learning context from past activities
      if (activityContextRef.current) {
        prompt += ` ${activityContextRef.current}`;
      }
      // Add keyword position context if available
      const rankedKeywords = keywords.filter((k) => k.current_rank != null).slice(0, 5);
      if (rankedKeywords.length > 0) {
        const positionInfo = rankedKeywords.map((k) => `"${k.keyword}" at position ${k.current_rank}`).join(', ');
        prompt += ` The user's best-performing keywords are: ${positionInfo}. Suggest keywords in similar niches.`;
      }
      prompt += ` Return each keyword on a new line, nothing else.`;

      const res = await apiPost<{ content: string; model: string; tokens_used: number }>(
        '/api/ai/generate',
        {
          type: 'custom',
          prompt,
          context: {
            module: 'seo',
            existing_keywords: keywords.map((k) => k.keyword).slice(0, 20),
          },
        }
      );

      const parsed = res.data.content
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      setSuggestions(parsed);
      setShowSuggestions(true);

      // Log activity
      apiPost('/api/ai/module-context', {
        module: 'seo',
        context_type: 'keyword_added',
        context_data: { ai_suggested: true, suggestion_count: parsed.length },
      });
    } catch {
      // AI service not available
    } finally {
      setSuggesting(false);
    }
  }

  const dialogProjectId = editKeyword?.project_id ?? (selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id ?? '');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keywords"
        description="Track keyword rankings across your SEO projects"
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSuggestKeywords}
            disabled={projects.length === 0 || suggesting}
          >
            {suggesting ? (
              <CcdLoader size="sm" className="mr-2" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
            )}
            Suggest Keywords
          </Button>
          <Button onClick={handleAdd} disabled={projects.length === 0}>
            <Plus className="mr-2 h-4 w-4" />
            Add Keyword
          </Button>
        </div>
      </PageHeader>

      <div className="flex items-center gap-4">
        <div className="w-64">
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-sm">AI Suggested Keywords</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
              Dismiss
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((kw, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm border border-emerald-200"
                >
                  {kw}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      ) : keywords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No keywords tracked</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add keywords to your SEO projects to start tracking rankings
            </p>
            <Button onClick={handleAdd} disabled={projects.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Keyword
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <KeywordTable
              keywords={keywords}
              loading={false}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      )}

      {dialogProjectId && (
        <KeywordDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          projectId={dialogProjectId}
          keyword={editKeyword}
          onSuccess={fetchKeywords}
        />
      )}
    </div>
  );
}
