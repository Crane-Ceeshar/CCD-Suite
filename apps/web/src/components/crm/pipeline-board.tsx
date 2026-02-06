'use client';

import * as React from 'react';
import { Card, CardContent, Badge, StatusBadge, EmptyState, LoadingSpinner } from '@ccd/ui';
import { DollarSign, GripVertical, LayoutGrid } from 'lucide-react';

interface DealCard {
  id: string;
  title: string;
  value: number;
  currency: string;
  company?: { id: string; name: string } | null;
  contact?: { id: string; first_name: string; last_name: string } | null;
  status: string;
}

interface Stage {
  id: string;
  name: string;
  color: string | null;
  position: number;
  deals: DealCard[];
}

export function PipelineBoard() {
  const [stages, setStages] = React.useState<Stage[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Placeholder - will fetch from API
    setStages([
      { id: '1', name: 'Lead', color: '#94a3b8', position: 0, deals: [] },
      { id: '2', name: 'Qualified', color: '#3b82f6', position: 1, deals: [] },
      { id: '3', name: 'Proposal', color: '#8b5cf6', position: 2, deals: [] },
      { id: '4', name: 'Negotiation', color: '#f59e0b', position: 3, deals: [] },
      { id: '5', name: 'Closed Won', color: '#22c55e', position: 4, deals: [] },
    ]);
    setLoading(false);
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading pipeline..." />;
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div key={stage.id} className="flex w-72 flex-shrink-0 flex-col">
          {/* Stage header */}
          <div className="mb-3 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: stage.color ?? '#94a3b8' }}
            />
            <h3 className="text-sm font-semibold">{stage.name}</h3>
            <Badge variant="secondary" className="ml-auto">
              {stage.deals.length}
            </Badge>
          </div>

          {/* Drop zone */}
          <div className="flex flex-1 flex-col gap-2 rounded-lg bg-muted/50 p-2 min-h-[200px]">
            {stage.deals.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No deals in this stage
              </p>
            ) : (
              stage.deals.map((deal) => (
                <Card
                  key={deal.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{deal.title}</p>
                        {deal.company && (
                          <p className="text-xs text-muted-foreground">
                            {deal.company.name}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <DollarSign className="h-3 w-3" />
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: deal.currency,
                            minimumFractionDigits: 0,
                          }).format(deal.value)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
