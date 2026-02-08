'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  ScrollArea,
  toast,
} from '@ccd/ui';
import { Sparkles, Loader2 } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface EnrichButtonProps {
  entityType: 'contact' | 'company';
  entityId: string;
  entityData: Record<string, unknown>;
  onEnrichApplied: () => void;
}

function buildPrompt(entityType: 'contact' | 'company', entityData: Record<string, unknown>): string {
  if (entityType === 'contact') {
    return (
      'Based on the following contact information, analyze and suggest additional data to enrich this contact profile. ' +
      'Suggest: potential social media profiles, additional professional details, suggested tags or categories, and any insights based on their role/company. ' +
      'Format your response clearly with sections.\n\nContact data: ' +
      JSON.stringify(entityData)
    );
  }

  return (
    'Based on the following company information, analyze and suggest additional data to enrich this company profile. ' +
    'Suggest: industry classification, estimated company size, key products/services, social media presence, competitors, and market positioning. ' +
    'Format your response clearly with sections.\n\nCompany data: ' +
    JSON.stringify(entityData)
  );
}

export function EnrichButton({ entityType, entityId, entityData, onEnrichApplied }: EnrichButtonProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function handleEnrich() {
    setLoading(true);
    setResponse(null);
    setError(null);

    const prompt = buildPrompt(entityType, entityData);

    try {
      const res = await apiPost<{
        conversation_id: string;
        message: { role: string; content: string; model: string; tokens_used: number | null };
      }>('/api/ai/chat', {
        content: prompt,
        module_context: 'crm',
        entity_context: {
          entity_type: entityType,
          entity_id: entityId,
          entity_data: entityData,
        },
      });

      setResponse(res.data.message.content);
    } catch {
      setError(
        'AI enrichment service is not available yet. Please ensure the AI gateway is running.'
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    setResponse(null);
    setError(null);
    // Start enrichment immediately when dialog opens
    setTimeout(() => handleEnrich(), 0);
  }

  function handleApply() {
    toast({
      title: 'Enrichment suggestions noted',
      description: 'You can manually update the record with the suggested information.',
    });
    onEnrichApplied();
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Sparkles className="mr-2 h-4 w-4" />
        Enrich with AI
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              AI Enrichment — {entityType === 'contact' ? 'Contact' : 'Company'}
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis and suggestions to enrich this {entityType} profile.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="pr-4">
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing {entityType}...
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {response && (
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 font-mono text-sm leading-relaxed">
                  {response}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button onClick={handleApply} disabled={!response || loading}>
              Apply Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
