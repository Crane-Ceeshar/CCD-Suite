'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  StatusBadge,
  ConfirmationDialog,
  CcdLoader,
  EmptyState,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  toast,
} from '@ccd/ui';
import { Webhook as WebhookIcon, Plus, Pencil, Trash2, Play } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { EnterpriseGate } from '@/components/settings/enterprise-gate';
import { WebhookDialog } from '@/components/settings/webhook-dialog';
import type { Webhook } from '@ccd/shared';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function formatRelativeTime(date: string | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function truncateUrl(url: string, maxLen = 40): string {
  if (url.length <= maxLen) return url;
  return url.slice(0, maxLen) + '...';
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function WebhooksSettingsPage() {
  const [webhooks, setWebhooks] = React.useState<Webhook[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingWebhook, setEditingWebhook] = React.useState<Webhook | undefined>(undefined);
  const [testingId, setTestingId] = React.useState<string | null>(null);

  const loadWebhooks = React.useCallback(async () => {
    try {
      const res = await apiGet<Webhook[]>('/api/settings/webhooks');
      setWebhooks(res.data ?? []);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to load webhooks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWebhooks();
  }, [loadWebhooks]);

  function handleCreate() {
    setEditingWebhook(undefined);
    setDialogOpen(true);
  }

  function handleEdit(webhook: Webhook) {
    setEditingWebhook(webhook);
    setDialogOpen(true);
  }

  async function handleTest(webhook: Webhook) {
    setTestingId(webhook.id);
    try {
      const res = await apiPost<{ status_code: number; response_time_ms: number }>(
        `/api/settings/webhooks/${webhook.id}/test`,
        {}
      );
      toast({
        title: 'Test sent',
        description: `Status: ${res.data?.status_code ?? 'N/A'} | Response time: ${res.data?.response_time_ms ?? 'N/A'}ms`,
      });
    } catch (err) {
      toast({
        title: 'Test failed',
        description: err instanceof Error ? err.message : 'Could not test webhook.',
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  }

  async function handleDelete(webhook: Webhook) {
    try {
      await apiDelete(`/api/settings/webhooks/${webhook.id}`);
      toast({
        title: 'Webhook deleted',
        description: `"${webhook.name}" has been removed.`,
      });
      loadWebhooks();
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete webhook.',
        variant: 'destructive',
      });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <EnterpriseGate feature="Webhook configuration">
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <WebhookIcon className="h-5 w-5 text-primary" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Send real-time notifications to external services when events occur
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <EmptyState
              icon={<WebhookIcon className="h-5 w-5 text-muted-foreground" />}
              title="No webhooks configured"
              description="Create a webhook to start receiving event notifications at your endpoint."
              className="min-h-[200px] border-0"
            />
          ) : (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors bg-muted/30">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        URL
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Events
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Last Triggered
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {webhooks.map((wh) => (
                      <tr
                        key={wh.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="p-4 align-middle font-medium">
                          {wh.name}
                        </td>
                        <td className="p-4 align-middle">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-muted-foreground font-mono text-xs cursor-default">
                                  {truncateUrl(wh.url)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono text-xs">{wh.url}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-wrap gap-1">
                            {wh.events.slice(0, 3).map((event) => (
                              <Badge
                                key={event}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {event}
                              </Badge>
                            ))}
                            {wh.events.length > 3 && (
                              <Badge variant="outline" className="text-[10px]">
                                +{wh.events.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <StatusBadge
                            status={wh.is_active ? 'active' : 'inactive'}
                          />
                        </td>
                        <td className="p-4 align-middle text-muted-foreground text-sm">
                          {formatRelativeTime(wh.last_triggered_at)}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(wh)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleTest(wh)}
                                    disabled={testingId === wh.id}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Test</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <ConfirmationDialog
                              trigger={
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              }
                              title="Delete Webhook"
                              description={`Are you sure you want to delete "${wh.name}"? This action cannot be undone.`}
                              confirmLabel="Delete"
                              variant="destructive"
                              onConfirm={() => handleDelete(wh)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Dialog */}
      <WebhookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        webhook={editingWebhook}
        onSuccess={loadWebhooks}
      />

    </div>
    </EnterpriseGate>
  );
}
