'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge } from '@ccd/ui';
import { Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SEOKeywordsPage() {
  const [keywords] = useState<any[]>([]);

  const getRankChange = (current: number | null, previous: number | null) => {
    if (!current || !previous) return { icon: Minus, color: 'text-muted-foreground', text: '—' };
    const diff = previous - current; // positive = improved (lower rank is better)
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${diff}` };
    if (diff < 0) return { icon: TrendingDown, color: 'text-red-600', text: `${diff}` };
    return { icon: Minus, color: 'text-muted-foreground', text: '0' };
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Keywords"
        description="Track keyword rankings across your SEO projects"
      />

      {keywords.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No keywords tracked</h3>
            <p className="text-sm text-muted-foreground">
              Add keywords to your SEO projects to start tracking rankings
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Keyword</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Rank</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Change</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Volume</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Difficulty</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((kw) => {
                  const change = getRankChange(kw.current_rank, kw.previous_rank);
                  const ChangeIcon = change.icon;
                  return (
                    <tr key={kw.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="p-4">
                        <p className="font-medium">{kw.keyword}</p>
                        {kw.url && <p className="text-xs text-muted-foreground truncate max-w-xs">{kw.url}</p>}
                      </td>
                      <td className="p-4 text-right font-mono">{kw.current_rank || '—'}</td>
                      <td className="p-4 text-right">
                        <span className={`flex items-center justify-end gap-1 ${change.color}`}>
                          <ChangeIcon className="h-3 w-3" />
                          {change.text}
                        </span>
                      </td>
                      <td className="p-4 text-right">{kw.search_volume?.toLocaleString() || '—'}</td>
                      <td className="p-4 text-right">{kw.difficulty || '—'}/100</td>
                      <td className="p-4 text-center">
                        <Badge variant={kw.status === 'achieved' ? 'default' : 'secondary'}>
                          {kw.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
