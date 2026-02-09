'use client';

import { useState } from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  CcdLoader,
} from '@ccd/ui';
import { Plus, Swords, Trash2, Sparkles, Pencil, Check, X } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { CompetitorCard } from '@/components/seo/competitor-card';

interface Competitor {
  domain: string;
  metrics: {
    domain_authority: number | null;
    keywords: number | null;
    backlinks: number | null;
  };
}

interface EditingMetrics {
  domain_authority: string;
  keywords: string;
  backlinks: string;
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newDomain, setNewDomain] = useState('');

  // AI Gap Analysis state
  const [analyzingDomain, setAnalyzingDomain] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<Record<string, string>>({});

  // Inline editing state
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editingMetrics, setEditingMetrics] = useState<EditingMetrics>({
    domain_authority: '',
    keywords: '',
    backlinks: '',
  });

  function handleAdd() {
    const domain = newDomain.trim();
    if (!domain) return;
    if (competitors.some((c) => c.domain === domain)) return;

    setCompetitors((prev) => [
      ...prev,
      { domain, metrics: { domain_authority: null, keywords: null, backlinks: null } },
    ]);
    setNewDomain('');
  }

  function handleRemove(domain: string) {
    setCompetitors((prev) => prev.filter((c) => c.domain !== domain));
    setGapAnalysis((prev) => {
      const next = { ...prev };
      delete next[domain];
      return next;
    });
    if (editingDomain === domain) {
      setEditingDomain(null);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  function startEditing(comp: Competitor) {
    setEditingDomain(comp.domain);
    setEditingMetrics({
      domain_authority: comp.metrics.domain_authority !== null ? String(comp.metrics.domain_authority) : '',
      keywords: comp.metrics.keywords !== null ? String(comp.metrics.keywords) : '',
      backlinks: comp.metrics.backlinks !== null ? String(comp.metrics.backlinks) : '',
    });
  }

  function cancelEditing() {
    setEditingDomain(null);
  }

  function saveEditing(domain: string) {
    setCompetitors((prev) =>
      prev.map((c) => {
        if (c.domain !== domain) return c;
        return {
          ...c,
          metrics: {
            domain_authority: editingMetrics.domain_authority.trim() !== '' ? Number(editingMetrics.domain_authority) : null,
            keywords: editingMetrics.keywords.trim() !== '' ? Number(editingMetrics.keywords) : null,
            backlinks: editingMetrics.backlinks.trim() !== '' ? Number(editingMetrics.backlinks) : null,
          },
        };
      }),
    );
    setEditingDomain(null);
  }

  async function handleGapAnalysis(domain: string, metrics: Competitor['metrics']) {
    setAnalyzingDomain(domain);
    try {
      const daText = metrics.domain_authority !== null ? `DA ${metrics.domain_authority}` : 'DA unknown';
      const kwText = metrics.keywords !== null ? `${metrics.keywords} keywords` : 'keywords unknown';
      const blText = metrics.backlinks !== null ? `${metrics.backlinks} backlinks` : 'backlinks unknown';

      const res = await apiPost<{ message: { content: string } }>('/api/ai/chat', {
        content: `Perform a competitive SEO gap analysis for the domain "${domain}". Their metrics: ${daText}, ${kwText}, ${blText}. Identify: 1) Keyword gaps they may be exploiting, 2) Content strategy differences, 3) Backlink opportunities, 4) Quick wins to compete. Be specific and actionable.`,
        module_context: 'seo',
        entity_context: {
          entity_type: 'competitor',
          entity_data: { domain, ...metrics },
        },
      });

      setGapAnalysis((prev) => ({
        ...prev,
        [domain]: res.data.message.content,
      }));

      // Log activity
      apiPost('/api/ai/module-context', {
        module: 'seo',
        context_type: 'competitor_analyzed',
        context_data: { domain, ai_analyzed: true },
      });
    } catch {
      // AI service not available
    } finally {
      setAnalyzingDomain(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Competitors"
        description="Analyze competitor SEO strategies and performance"
        breadcrumbs={[
          { label: 'SEO', href: '/seo' },
          { label: 'Competitors' },
        ]}
      />

      <div className="flex items-center gap-3">
        <Input
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter competitor domain (e.g. competitor.com)"
          className="max-w-sm"
        />
        <Button onClick={handleAdd} disabled={!newDomain.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Competitor
        </Button>
      </div>

      {competitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Swords className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No competitors tracked</h3>
            <p className="text-sm text-muted-foreground">
              Add competitor domains to compare SEO metrics
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {competitors.map((comp) => (
              <div key={comp.domain} className="space-y-0">
                <div className="relative group">
                  <CompetitorCard domain={comp.domain} metrics={comp.metrics} />
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGapAnalysis(comp.domain, comp.metrics)}
                      disabled={analyzingDomain === comp.domain}
                      title="AI Gap Analysis"
                    >
                      {analyzingDomain === comp.domain ? (
                        <CcdLoader size="sm" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(comp)}
                      title="Edit metrics"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(comp.domain)}
                      title="Remove competitor"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>

                  {/* Hover hint when metrics are null */}
                  {comp.metrics.domain_authority === null &&
                    comp.metrics.keywords === null &&
                    comp.metrics.backlinks === null &&
                    editingDomain !== comp.domain && (
                      <div className="absolute inset-x-0 bottom-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
                          Click <Pencil className="inline h-3 w-3" /> to add metrics
                        </span>
                      </div>
                    )}
                </div>

                {/* Inline edit form */}
                {editingDomain === comp.domain && (
                  <div className="border border-t-0 rounded-b-lg bg-muted/30 p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Edit Metrics</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">DA Score</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingMetrics.domain_authority}
                          onChange={(e) =>
                            setEditingMetrics((prev) => ({ ...prev, domain_authority: e.target.value }))
                          }
                          placeholder="--"
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Keywords</label>
                        <input
                          type="number"
                          min="0"
                          value={editingMetrics.keywords}
                          onChange={(e) =>
                            setEditingMetrics((prev) => ({ ...prev, keywords: e.target.value }))
                          }
                          placeholder="--"
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Backlinks</label>
                        <input
                          type="number"
                          min="0"
                          value={editingMetrics.backlinks}
                          onChange={(e) =>
                            setEditingMetrics((prev) => ({ ...prev, backlinks: e.target.value }))
                          }
                          placeholder="--"
                          className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => saveEditing(comp.domain)}>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {Object.entries(gapAnalysis).map(([domain, analysis]) => (
            <Card key={domain} className="border-emerald-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <CardTitle className="text-base">AI Gap Analysis: {domain}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setGapAnalysis((prev) => {
                      const next = { ...prev };
                      delete next[domain];
                      return next;
                    })
                  }
                >
                  Dismiss
                </Button>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{analysis}</div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
