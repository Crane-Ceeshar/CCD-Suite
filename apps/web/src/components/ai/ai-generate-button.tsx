'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ScrollArea,
  CcdSpinner,
} from '@ccd/ui';
import { Sparkles } from 'lucide-react';
import { useAiGenerate } from '@/hooks/use-ai-generate';

interface AiGenerateButtonProps {
  /** Button label text */
  label: string;
  /** AI generation type passed to the API */
  type: string;
  /** Module context for activity logging */
  module: 'social' | 'seo';
  /** Callback with the generated text when user clicks Apply */
  onResult: (text: string) => void;
  /** Build the prompt dynamically before generation */
  promptBuilder: () => string;
  /** Optional extra context to send with the prompt */
  contextBuilder?: () => Record<string, unknown>;
  /** Disabled state */
  disabled?: boolean;
  /** Button size variant */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Button style variant */
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export function AiGenerateButton({
  label,
  type,
  module,
  onResult,
  promptBuilder,
  contextBuilder,
  disabled = false,
  size = 'sm',
  variant = 'outline',
}: AiGenerateButtonProps) {
  const [open, setOpen] = React.useState(false);
  const { generate, generating, result, error, reset } = useAiGenerate({ type, module });

  function handleOpen() {
    reset();
    setOpen(true);
    // Generate immediately when dialog opens
    const prompt = promptBuilder();
    const context = contextBuilder?.();
    generate(prompt, context);
  }

  function handleApply() {
    if (result) {
      onResult(result);
      setOpen(false);
    }
  }

  function handleRegenerate() {
    const prompt = promptBuilder();
    const context = contextBuilder?.();
    generate(prompt, context);
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
        disabled={disabled}
        type="button"
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              AI Generated Content
            </DialogTitle>
            <DialogDescription>
              Review the AI-generated content below and apply it to your workflow.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="pr-4">
              {generating && (
                <div className="flex flex-col items-center justify-center py-12">
                  <CcdSpinner size="lg" className="text-emerald-600 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Generating content...
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {result && !generating && (
                <div className="whitespace-pre-wrap rounded-lg border bg-muted/30 p-4 text-sm leading-relaxed">
                  {result}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            {result && !generating && (
              <Button variant="ghost" onClick={handleRegenerate}>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Regenerate
              </Button>
            )}
            <Button onClick={handleApply} disabled={!result || generating}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
