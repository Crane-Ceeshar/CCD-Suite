'use client';

import { Badge, Button, Card, CardContent } from '@ccd/ui';
import { CheckCircle2, Circle, Clock, X } from 'lucide-react';
import { apiPatch } from '@/lib/api';
import type { SeoRecommendation, RecommendationStatus } from '@ccd/shared/types/seo';

interface RecommendationsListProps {
  recommendations: SeoRecommendation[];
  onStatusChange: (id: string, status: RecommendationStatus) => void;
}

const typeColors: Record<string, string> = {
  technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  content: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  on_page: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  off_page: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  performance: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
};

const priorityConfig: Record<string, { color: string; label: string }> = {
  critical: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: 'Critical' },
  high: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'High' },
  medium: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Medium' },
  low: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300', label: 'Low' },
};

export function RecommendationsList({ recommendations, onStatusChange }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No recommendations found</p>
      </div>
    );
  }

  async function handleStatusChange(id: string, newStatus: RecommendationStatus) {
    try {
      await apiPatch(`/api/seo/recommendations/${id}`, { status: newStatus });
      onStatusChange(id, newStatus);
    } catch {
      // Error handled silently
    }
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => {
        const priority = priorityConfig[rec.priority] ?? priorityConfig.low;
        const typeClass = typeColors[rec.type] ?? typeColors.technical;

        return (
          <Card key={rec.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeClass}`}>
                      {rec.type.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priority.color}`}>
                      {priority.label}
                    </span>
                    {rec.status === 'done' && (
                      <Badge variant="default" className="bg-green-600 text-white hover:bg-green-700">Done</Badge>
                    )}
                    {rec.status === 'in_progress' && (
                      <Badge variant="secondary">In Progress</Badge>
                    )}
                    {rec.status === 'dismissed' && (
                      <Badge variant="outline">Dismissed</Badge>
                    )}
                  </div>
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  {rec.description && (
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {rec.status !== 'open' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Reopen"
                      onClick={() => handleStatusChange(rec.id, 'open')}
                    >
                      <Circle className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {rec.status !== 'in_progress' && rec.status !== 'done' && rec.status !== 'dismissed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Mark In Progress"
                      onClick={() => handleStatusChange(rec.id, 'in_progress')}
                    >
                      <Clock className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {rec.status !== 'done' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Mark Done"
                      onClick={() => handleStatusChange(rec.id, 'done')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    </Button>
                  )}
                  {rec.status !== 'dismissed' && rec.status !== 'done' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      title="Dismiss"
                      onClick={() => handleStatusChange(rec.id, 'dismissed')}
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
