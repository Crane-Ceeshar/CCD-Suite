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
import { Plus, Swords, Trash2, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/api';
import { CompetitorCard } from '@/components/seo/competitor-card';

interface Competitor {
  domain: string;
  metrics: {
    domain_authority: number;
    keywords: number;
    backlinks: number;
  };
}

function generatePlaceholderMetrics(): Competitor['metrics'] {
  return {
    domain_authority: Math.floor(Math.random() * 60) + 20,
    keywords: Math.floor(Math.random() * 5000) + 100,
    backlinks: Math.floor(Math.random() * 10000) + 500,
  };
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [newDomain, setNewDomain] = useState('');

  // AI Gap Analysis state
  const [analyzingDomain, setAnalyzingDomain] = useState<string | null>(null);
  const [gapAnalysis, setGapAnalysis] = useState<Record<string, string>>({});

  function handleAdd() {
    const domain = newDomain.trim();
    if (!domain) return;
    if (competitors.some((c) => c.domain === domain)) return;

    setCompetitors((prev) => [
      ...prev,
      { domain, metrics: generatePlaceholderMetrics() },
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
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  }

  async function handleGapAnalysis(domain: string, metrics: Competitor['metrics']) {
    setAnalyzingDomain(domain);
    try {
      const res = await apiPost<{ message: { content: string } }>('/api/ai/chat', {
        content: `Perform a competitive SEO gap analysis for the domain "${domain}". Their metrics: DA ${metrics.domain_authority}, ${metrics.keywords} keywords, ${metrics.backlinks} backlinks. Identify: 1) Keyword gaps they may be exploiting, 2) Content strategy differences, 3) Backlink opportunities, 4) Quick wins to compete. Be specific and actionable.`,
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
              <div key={comp.domain} className="relative group">
                <CompetitorCard domain={comp.domain} metrics={comp.metrics} />
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleGapAnalysis(comp.domain, comp.metrics)}
                    disabled={analyzingDomain === comp.domain}
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
                    onClick={() => handleRemove(comp.domain)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
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
