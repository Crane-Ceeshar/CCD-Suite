'use client';

import * as React from 'react';
import { Card, CardContent, Badge, Button, toast } from '@ccd/ui';
import { Globe, CheckCircle2, XCircle, Loader2, ExternalLink, Send } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────

interface Integration {
  id: string;
  platform: string;
  name: string;
  is_active: boolean;
  last_published_at: string | null;
}

interface PublishLog {
  id: string;
  integration_id: string;
  status: 'pending' | 'published' | 'failed';
  external_url: string | null;
  error_message: string | null;
  published_at: string | null;
}

interface PublishDialogProps {
  contentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Platform labels / colors ────────────────────────────────────────

const PLATFORM_META: Record<string, { label: string; color: string }> = {
  wordpress: { label: 'WordPress', color: '#21759B' },
  medium: { label: 'Medium', color: '#000000' },
  ghost: { label: 'Ghost', color: '#15171A' },
  webflow: { label: 'Webflow', color: '#4353FF' },
};

// ── Component ──────────────────────────────────────────────────────

export function PublishDialog({ contentId, open, onOpenChange }: PublishDialogProps) {
  const [integrations, setIntegrations] = React.useState<Integration[]>([]);
  const [publishLogs, setPublishLogs] = React.useState<Map<string, PublishLog>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [publishing, setPublishing] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;

    async function fetchIntegrations() {
      try {
        setLoading(true);
        // Fetch integrations — this endpoint may not exist yet, handle gracefully
        const res = await apiGet<Integration[]>('/api/admin/integrations').catch(() => ({
          data: [] as Integration[],
        }));
        setIntegrations(res.data ?? []);
      } catch {
        setIntegrations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchIntegrations();
  }, [open]);

  async function handlePublish(integrationId: string) {
    try {
      setPublishing(integrationId);

      const res = await apiPost<PublishLog>(`/api/content/${contentId}/publish`, {
        integration_id: integrationId,
        content_item_id: contentId,
      });

      setPublishLogs((prev) => {
        const next = new Map(prev);
        next.set(integrationId, res.data);
        return next;
      });

      toast({
        title: 'Published!',
        description: `Content published successfully.`,
      });
    } catch (err) {
      toast({
        title: 'Publish Failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setPublishing(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Publish Content</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            &times;
          </Button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No publishing integrations configured</p>
              <p className="text-xs mt-1">Add integrations in Settings to enable publishing.</p>
            </div>
          ) : (
            integrations.map((integration) => {
              const meta = PLATFORM_META[integration.platform] ?? {
                label: integration.platform,
                color: '#6B7280',
              };
              const log = publishLogs.get(integration.id);
              const isPublishing = publishing === integration.id;

              return (
                <Card key={integration.id} className="overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: meta.color }}
                      >
                        {meta.label.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{integration.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">
                            {meta.label}
                          </Badge>
                          {!integration.is_active && (
                            <Badge variant="outline" className="text-[10px] text-amber-600">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {log?.status === 'published' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          {log.external_url && (
                            <a
                              href={log.external_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      )}
                      {log?.status === 'failed' && (
                        <div className="flex items-center gap-1 text-destructive" title={log.error_message ?? ''}>
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">Failed</span>
                        </div>
                      )}
                      <Button
                        size="sm"
                        disabled={!integration.is_active || isPublishing || log?.status === 'published'}
                        onClick={() => handlePublish(integration.id)}
                      >
                        {isPublishing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <Send className="h-3.5 w-3.5 mr-1" />
                        )}
                        {log?.status === 'published' ? 'Published' : 'Publish'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-3 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
