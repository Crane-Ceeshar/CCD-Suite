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
  Input,
  FormField,
} from '@ccd/ui';
import { toast } from '@ccd/ui';
import { Send, Loader2, Mail } from 'lucide-react';
import { apiPost } from '@/lib/api';

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactEmail: string;
  contactName: string;
  dealId?: string;
  onSuccess?: () => void;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  contactId,
  contactEmail,
  contactName,
  dealId,
  onSuccess,
}: EmailComposeDialogProps) {
  const [subject, setSubject] = React.useState('');
  const [body, setBody] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setSubject('');
      setBody('');
      setError('');
    }
  }, [open]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }
    if (!body.trim()) {
      setError('Message body is required');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Convert plain text to basic HTML
      const bodyHtml = body
        .split('\n')
        .map((line) => `<p>${line || '&nbsp;'}</p>`)
        .join('');

      await apiPost(`/api/crm/contacts/${contactId}/email`, {
        subject: subject.trim(),
        body_html: bodyHtml,
        ...(dealId ? { deal_id: dealId } : {}),
      });

      toast({
        title: 'Email sent',
        description: `Email sent to ${contactName}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Compose Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {contactName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSend} className="space-y-4">
          <FormField label="To">
            <Input
              value={contactEmail}
              disabled
              className="bg-muted"
            />
          </FormField>

          <FormField label="Subject" required>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              autoFocus
            />
          </FormField>

          <FormField label="Message" required>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex min-h-[180px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="Write your message..."
            />
          </FormField>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
