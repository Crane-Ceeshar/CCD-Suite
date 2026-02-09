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
  Badge,
  CcdSpinner,
} from '@ccd/ui';
import { apiPatch } from '@/lib/api';
import type { SocialComment } from '@ccd/shared/types/social';

const sentimentConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  positive: { label: 'Positive', variant: 'default' },
  neutral: { label: 'Neutral', variant: 'secondary' },
  negative: { label: 'Negative', variant: 'destructive' },
};

interface CommentReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comment?: SocialComment | null;
  onSuccess: () => void;
  /** Optional AI-generated reply to pre-fill the textarea */
  initialReply?: string;
}

export function CommentReplyDialog({ open, onOpenChange, comment, onSuccess, initialReply }: CommentReplyDialogProps) {
  const [replyContent, setReplyContent] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setReplyContent(initialReply || comment?.reply_content || '');
      setError('');
    }
  }, [open, comment, initialReply]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!replyContent.trim()) {
      setError('Reply content is required');
      return;
    }
    if (!comment) return;

    setSaving(true);
    setError('');

    try {
      await apiPatch(`/api/social/comments/${comment.id}`, {
        reply_content: replyContent.trim(),
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reply');
    } finally {
      setSaving(false);
    }
  }

  const sentiment = comment?.sentiment ? sentimentConfig[comment.sentiment] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reply to Comment</DialogTitle>
          <DialogDescription>
            Respond to the comment below
          </DialogDescription>
        </DialogHeader>
        {comment && (
          <div className="rounded-lg border p-3 bg-muted/50 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-medium shrink-0">
                {comment.author_name?.[0] ?? '?'}
              </div>
              <span className="font-medium text-sm">{comment.author_name ?? 'Unknown'}</span>
              <span className="text-xs text-muted-foreground capitalize">{comment.platform}</span>
              {sentiment && (
                <Badge variant={sentiment.variant} className="text-xs">
                  {sentiment.label}
                </Badge>
              )}
            </div>
            <p className="text-sm">{comment.content}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Your Reply</label>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Type your reply..."
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Send Reply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
