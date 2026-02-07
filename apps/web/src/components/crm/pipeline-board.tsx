'use client';

import * as React from 'react';
import { Card, CardContent, Badge, LoadingSpinner, Button } from '@ccd/ui';
import { DollarSign, GripVertical, MoreHorizontal, Pencil, Trophy, XCircle, Trash2 } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

interface DealCard {
  id: string;
  title: string;
  value: number;
  currency: string;
  company?: { id: string; name: string } | null;
  contact?: { id: string; first_name: string; last_name: string } | null;
  expected_close_date?: string | null;
  status: string;
  position: number;
  stage_id: string;
  pipeline_id: string;
}

interface Stage {
  id: string;
  name: string;
  color: string | null;
  position: number;
  deals: DealCard[];
}

interface PipelineData {
  id: string;
  name: string;
  stages: Stage[];
}

interface PipelineBoardProps {
  onEditDeal?: (deal: DealCard) => void;
  onRefresh?: number;
}

function SortableDealCard({
  deal,
  onEdit,
  onMarkWon,
  onMarkLost,
  onDelete,
}: {
  deal: DealCard;
  onEdit?: (deal: DealCard) => void;
  onMarkWon?: (deal: DealCard) => void;
  onMarkLost?: (deal: DealCard) => void;
  onDelete?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { type: 'deal', deal } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="cursor-pointer transition-shadow hover:shadow-md relative group"
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          </button>
          <div className="flex-1 space-y-1 min-w-0">
            <p className="text-sm font-medium truncate">{deal.title}</p>
            {deal.company && (
              <p className="text-xs text-muted-foreground truncate">{deal.company.name}</p>
            )}
            {deal.contact && (
              <p className="text-xs text-muted-foreground/70 truncate">
                {deal.contact.first_name} {deal.contact.last_name}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: deal.currency,
                  minimumFractionDigits: 0,
                }).format(deal.value)}
              </div>
              {deal.expected_close_date && (
                <span className="text-[10px] text-muted-foreground">
                  {new Date(deal.expected_close_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="relative">
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-6 z-50 w-36 rounded-md border bg-popover p-1 shadow-md">
                  {onEdit && (
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent"
                      onClick={() => { setMenuOpen(false); onEdit(deal); }}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                  )}
                  {onMarkWon && (
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-green-600"
                      onClick={() => { setMenuOpen(false); onMarkWon(deal); }}
                    >
                      <Trophy className="h-3 w-3" /> Mark Won
                    </button>
                  )}
                  {onMarkLost && (
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-red-600"
                      onClick={() => { setMenuOpen(false); onMarkLost(deal); }}
                    >
                      <XCircle className="h-3 w-3" /> Mark Lost
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs hover:bg-accent text-destructive"
                      onClick={() => { setMenuOpen(false); onDelete(deal.id); }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DroppableStage({
  stage,
  children,
}: {
  stage: Stage;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-${stage.id}`,
    data: { type: 'stage', stageId: stage.id },
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col gap-2 rounded-lg p-2 min-h-[200px] transition-colors ${
        isOver ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/50'
      }`}
    >
      {children}
    </div>
  );
}

function DealCardOverlay({ deal }: { deal: DealCard }) {
  return (
    <Card className="w-64 shadow-xl rotate-2 ring-2 ring-primary/50">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium truncate">{deal.title}</p>
            {deal.company && (
              <p className="text-xs text-muted-foreground">{deal.company.name}</p>
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
  );
}

export function PipelineBoard({ onEditDeal, onRefresh }: PipelineBoardProps) {
  const [pipeline, setPipeline] = React.useState<PipelineData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeDeal, setActiveDeal] = React.useState<DealCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const loadPipeline = React.useCallback(async () => {
    try {
      const pipelinesRes = await apiGet<PipelineData[]>('/api/crm/pipelines');
      const pipelines = pipelinesRes.data;
      if (pipelines.length === 0) {
        setPipeline(null);
        setLoading(false);
        return;
      }
      const defaultPipeline = pipelines.find((p: PipelineData & { is_default?: boolean }) => p.is_default) ?? pipelines[0];
      const boardRes = await apiGet<PipelineData>(`/api/crm/pipelines/${defaultPipeline.id}`);
      setPipeline(boardRes.data);
    } catch {
      setPipeline(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPipeline();
  }, [loadPipeline, onRefresh]);

  function handleDragStart(event: DragStartEvent) {
    const dealData = event.active.data.current?.deal as DealCard | undefined;
    if (dealData) setActiveDeal(dealData);
  }

  function handleDragOver(event: DragOverEvent) {
    if (!pipeline) return;
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData?.deal) return;
    const activeDealData = activeData.deal as DealCard;

    // Determine target stage ID
    let targetStageId: string | null = null;
    if (overData?.type === 'stage') {
      targetStageId = overData.stageId as string;
    } else if (overData?.type === 'deal') {
      const overDeal = overData.deal as DealCard;
      targetStageId = overDeal.stage_id;
    }

    if (!targetStageId || targetStageId === activeDealData.stage_id) return;

    // Optimistic move between stages
    setPipeline((prev) => {
      if (!prev) return prev;
      const newStages = prev.stages.map((stage) => {
        if (stage.id === activeDealData.stage_id) {
          return { ...stage, deals: stage.deals.filter((d) => d.id !== activeDealData.id) };
        }
        if (stage.id === targetStageId) {
          const already = stage.deals.find((d) => d.id === activeDealData.id);
          if (already) return stage;
          return {
            ...stage,
            deals: [...stage.deals, { ...activeDealData, stage_id: targetStageId! }],
          };
        }
        return stage;
      });
      return { ...prev, stages: newStages };
    });
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);
    if (!pipeline) return;
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    if (!activeData?.deal) return;
    const activeDealData = activeData.deal as DealCard;

    // Determine target stage ID
    let targetStageId: string | null = null;
    const overData = over.data.current;
    if (overData?.type === 'stage') {
      targetStageId = overData.stageId as string;
    } else if (overData?.type === 'deal') {
      const overDeal = overData.deal as DealCard;
      targetStageId = overDeal.stage_id;
    }

    if (!targetStageId) return;

    // Find new position
    const targetStage = pipeline.stages.find((s) => s.id === targetStageId);
    const newPosition = targetStage?.deals.length ?? 0;

    // API call to persist
    try {
      await apiPatch(`/api/crm/deals/${activeDealData.id}`, {
        stage_id: targetStageId,
        position: newPosition,
      });
    } catch {
      // Revert on error
      loadPipeline();
    }
  }

  async function handleMarkWon(deal: DealCard) {
    try {
      await apiPatch(`/api/crm/deals/${deal.id}`, { status: 'won' });
      loadPipeline();
    } catch { /* ignore */ }
  }

  async function handleMarkLost(deal: DealCard) {
    try {
      await apiPatch(`/api/crm/deals/${deal.id}`, { status: 'lost' });
      loadPipeline();
    } catch { /* ignore */ }
  }

  async function handleDeleteDeal(id: string) {
    if (!confirm('Delete this deal?')) return;
    try {
      await apiDelete(`/api/crm/deals/${id}`);
      loadPipeline();
    } catch { /* ignore */ }
  }

  if (loading) {
    return <LoadingSpinner size="lg" label="Loading pipeline..." />;
  }

  if (!pipeline) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No pipeline found. Create one to get started.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipeline.stages.map((stage) => (
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
            <DroppableStage stage={stage}>
              <SortableContext
                items={stage.deals.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                {stage.deals.length === 0 ? (
                  <p className="py-8 text-center text-xs text-muted-foreground">
                    No deals in this stage
                  </p>
                ) : (
                  stage.deals.map((deal) => (
                    <SortableDealCard
                      key={deal.id}
                      deal={deal}
                      onEdit={onEditDeal}
                      onMarkWon={handleMarkWon}
                      onMarkLost={handleMarkLost}
                      onDelete={handleDeleteDeal}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableStage>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? <DealCardOverlay deal={activeDeal} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
