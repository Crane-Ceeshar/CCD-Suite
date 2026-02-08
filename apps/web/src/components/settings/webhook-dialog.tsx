'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Switch,
  Label,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Checkbox,
  CcdSpinner,
  toast,
  ScrollArea,
} from '@ccd/ui';
import { WEBHOOK_EVENT_GROUPS } from '@ccd/shared';
import type { Webhook } from '@ccd/shared';
import { apiPost, apiPatch } from '@/lib/api';
import { Copy, Check } from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Props                                                                      */
/* -------------------------------------------------------------------------- */

interface WebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhook?: Webhook;
  onSuccess: () => void;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export function WebhookDialog({
  open,
  onOpenChange,
  webhook,
  onSuccess,
}: WebhookDialogProps) {
  const isEdit = !!webhook;

  const [name, setName] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [isActive, setIsActive] = React.useState(true);
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Reset form when dialog opens / webhook changes
  React.useEffect(() => {
    if (open) {
      setName(webhook?.name ?? '');
      setUrl(webhook?.url ?? '');
      setIsActive(webhook?.is_active ?? true);
      setSelectedEvents(webhook?.events ?? []);
      setCopied(false);
    }
  }, [open, webhook]);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  }

  function toggleGroup(group: string) {
    const events = WEBHOOK_EVENT_GROUPS[group] ?? [];
    const allSelected = events.every((e) => selectedEvents.includes(e));
    if (allSelected) {
      setSelectedEvents((prev) => prev.filter((e) => !events.includes(e)));
    } else {
      setSelectedEvents((prev) => [
        ...prev,
        ...events.filter((e) => !prev.includes(e)),
      ]);
    }
  }

  async function handleCopySecret() {
    if (!webhook?.secret) return;
    try {
      await navigator.clipboard.writeText(webhook.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  }

  async function handleSave() {
    // Validation
    if (!name.trim()) {
      toast({
        title: 'Validation error',
        description: 'Name is required.',
        variant: 'destructive',
      });
      return;
    }

    if (!url.trim() || (!url.startsWith('http://') && !url.startsWith('https://'))) {
      toast({
        title: 'Validation error',
        description: 'URL must start with http:// or https://',
        variant: 'destructive',
      });
      return;
    }

    if (selectedEvents.length === 0) {
      toast({
        title: 'Validation error',
        description: 'Select at least one event.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await apiPatch(`/api/settings/webhooks/${webhook.id}`, {
          name: name.trim(),
          url: url.trim(),
          events: selectedEvents,
          is_active: isActive,
        });
        toast({
          title: 'Webhook updated',
          description: 'Your webhook has been updated successfully.',
        });
      } else {
        await apiPost('/api/settings/webhooks', {
          name: name.trim(),
          url: url.trim(),
          events: selectedEvents,
          is_active: isActive,
        });
        toast({
          title: 'Webhook created',
          description: 'Your webhook has been created successfully.',
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save webhook.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Webhook' : 'Create Webhook'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update your webhook endpoint and event subscriptions.'
              : 'Configure a new webhook endpoint to receive event notifications.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 pb-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="webhook-name">Name</Label>
              <Input
                id="webhook-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Webhook"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url">URL</Label>
              <Input
                id="webhook-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/webhook"
              />
            </div>

            {/* Secret (edit mode only) */}
            {isEdit && webhook?.secret && (
              <div className="space-y-2">
                <Label htmlFor="webhook-secret">Secret</Label>
                <div className="flex gap-2">
                  <Input
                    id="webhook-secret"
                    value={webhook.secret}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopySecret}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Active */}
            <div className="flex items-center gap-3">
              <Switch
                id="webhook-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="webhook-active">Active</Label>
            </div>

            {/* Events */}
            <div className="space-y-2">
              <Label>Events</Label>
              <Accordion type="multiple" className="w-full">
                {Object.entries(WEBHOOK_EVENT_GROUPS).map(([group, events]) => {
                  const groupSelected = events.filter((e) =>
                    selectedEvents.includes(e)
                  ).length;
                  return (
                    <AccordionItem key={group} value={group}>
                      <AccordionTrigger className="text-sm capitalize">
                        <div className="flex items-center gap-2">
                          <span>{group}</span>
                          {groupSelected > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({groupSelected}/{events.length})
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-1">
                          {/* Select All for group */}
                          <div className="flex items-center gap-2 pb-1 border-b mb-2">
                            <Checkbox
                              id={`group-${group}`}
                              checked={events.every((e) =>
                                selectedEvents.includes(e)
                              )}
                              onCheckedChange={() => toggleGroup(group)}
                            />
                            <Label
                              htmlFor={`group-${group}`}
                              className="text-xs font-medium text-muted-foreground cursor-pointer"
                            >
                              Select all
                            </Label>
                          </div>
                          {events.map((event) => (
                            <div
                              key={event}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                id={`event-${event}`}
                                checked={selectedEvents.includes(event)}
                                onCheckedChange={() => toggleEvent(event)}
                              />
                              <Label
                                htmlFor={`event-${event}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {event}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <CcdSpinner size="sm" className="mr-2" />}
            {isEdit ? 'Save Changes' : 'Create Webhook'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
