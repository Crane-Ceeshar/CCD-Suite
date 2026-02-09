'use client';

import { Badge, Button, CcdLoader } from '@ccd/ui';
import { TrendingUp, TrendingDown, Minus, Pencil, Trash2 } from 'lucide-react';
import type { SeoKeyword } from '@ccd/shared/types/seo';

interface KeywordTableProps {
  keywords: SeoKeyword[];
  loading: boolean;
  onEdit: (kw: SeoKeyword) => void;
  onDelete: (id: string) => void;
}

function getRankChange(current: number | null, previous: number | null) {
  if (current == null || previous == null) return { icon: Minus, color: 'text-muted-foreground', text: '--' };
  const diff = previous - current;
  if (diff > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${diff}` };
  if (diff < 0) return { icon: TrendingDown, color: 'text-red-600', text: `${diff}` };
  return { icon: Minus, color: 'text-muted-foreground', text: '0' };
}

function getDifficultyColor(d: number) {
  if (d < 30) return 'bg-green-500';
  if (d <= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getStatusVariant(status: string): 'default' | 'secondary' {
  if (status === 'paused') return 'secondary';
  return 'default';
}

export function KeywordTable({ keywords, loading, onEdit, onDelete }: KeywordTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="md" />
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No keywords found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4 text-sm font-medium text-muted-foreground">Keyword</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Rank</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Change</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Volume</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Difficulty</th>
            <th className="text-center p-4 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
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
                  {kw.url && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{kw.url}</p>
                  )}
                </td>
                <td className="p-4 text-right font-mono">{kw.current_rank ?? '--'}</td>
                <td className="p-4 text-right">
                  <span className={`flex items-center justify-end gap-1 ${change.color}`}>
                    <ChangeIcon className="h-3 w-3" />
                    {change.text}
                  </span>
                </td>
                <td className="p-4 text-right">{kw.search_volume?.toLocaleString() ?? '--'}</td>
                <td className="p-4 text-right">
                  {kw.difficulty != null ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getDifficultyColor(kw.difficulty)}`}
                          style={{ width: `${kw.difficulty}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums">{kw.difficulty}</span>
                    </div>
                  ) : (
                    '--'
                  )}
                </td>
                <td className="p-4 text-center">
                  <Badge
                    variant={getStatusVariant(kw.status)}
                    className={kw.status === 'achieved' ? 'bg-green-600 text-white hover:bg-green-700' : undefined}
                  >
                    {kw.status}
                  </Badge>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(kw)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(kw.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
