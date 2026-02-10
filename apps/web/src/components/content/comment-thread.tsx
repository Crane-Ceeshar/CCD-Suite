'use client';

import * as React from 'react';
import { Button, Input, toast } from '@ccd/ui';
import { MessageSquare, Reply, Trash2, CheckCircle, Circle } from 'lucide-react';
import { apiPost, apiPatch, apiDelete } from '@/lib/api';

interface Comment {
  id: string;
  body: string;
  author_id: string;
  author?: { id: string; display_name: string; avatar_url?: string } | null;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
  position_anchor?: string | null;
  replies?: Comment[];
}

interface CommentThreadProps {
  comment: Comment;
  contentId: string;
  currentUserId: string;
  onRefresh: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function CommentThread({ comment, contentId, currentUserId, onRefresh }: CommentThreadProps) {
  const [showReply, setShowReply] = React.useState(false);
  const [replyBody, setReplyBody] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const authorName = comment.author?.display_name || 'Unknown';
  const isOwner = comment.author_id === currentUserId;

  async function handleReply() {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(`/api/content/${contentId}/comments`, {
        body: replyBody.trim(),
        parent_id: comment.id,
      });
      setReplyBody('');
      setShowReply(false);
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'Failed to post reply', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResolve() {
    try {
      await apiPatch(`/api/content/${contentId}/comments/${comment.id}`, {
        resolved: !comment.resolved,
      });
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'Failed to update comment', variant: 'destructive' });
    }
  }

  async function handleDelete() {
    try {
      await apiDelete(`/api/content/${contentId}/comments/${comment.id}`);
      onRefresh();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' });
    }
  }

  return (
    <div className={`border rounded-lg p-3 space-y-2 ${comment.resolved ? 'opacity-60 bg-muted/30' : 'bg-background'}`}>
      {/* Comment Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
          {comment.author?.avatar_url ? (
            <img src={comment.author.avatar_url} alt={authorName} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            getInitials(authorName)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate">{authorName}</span>
          <span className="text-xs text-muted-foreground ml-2">{formatRelativeTime(comment.created_at)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleResolve} title={comment.resolved ? 'Unresolve' : 'Resolve'}>
            {comment.resolved ? (
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
          {isOwner && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Comment Body */}
      <p className="text-sm leading-relaxed pl-9">{comment.body}</p>

      {/* Actions */}
      <div className="pl-9 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={() => setShowReply((v) => !v)}
        >
          <Reply className="mr-1 h-3 w-3" />
          Reply
        </Button>
      </div>

      {/* Reply Input */}
      {showReply && (
        <div className="pl-9 flex items-center gap-2">
          <Input
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Write a reply..."
            className="text-sm h-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !submitting) handleReply();
            }}
          />
          <Button size="sm" className="h-8 text-xs" onClick={handleReply} disabled={submitting || !replyBody.trim()}>
            Send
          </Button>
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-9 space-y-2 border-l-2 border-muted ml-3">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="pl-3 py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium">{reply.author?.display_name || 'Unknown'}</span>
                <span className="text-xs text-muted-foreground">{formatRelativeTime(reply.created_at)}</span>
                {reply.author_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-destructive ml-auto"
                    onClick={async () => {
                      try {
                        await apiDelete(`/api/content/${contentId}/comments/${reply.id}`);
                        onRefresh();
                      } catch {
                        toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <p className="text-sm">{reply.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
