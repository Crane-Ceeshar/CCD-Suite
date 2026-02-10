'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { MessageSquare, Send } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { CommentThread } from './comment-thread';

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

interface CommentSidebarProps {
  contentId: string;
  currentUserId: string;
}

export function CommentSidebar({ contentId, currentUserId }: CommentSidebarProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newComment, setNewComment] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  const [count, setCount] = React.useState(0);

  const fetchComments = React.useCallback(async () => {
    try {
      const res = await apiGet<{ comments: Comment[]; count: number }>(
        `/api/content/${contentId}/comments?limit=50`
      );
      setComments(res.data.comments ?? []);
      setCount(res.data.count ?? 0);
    } catch {
      // silently fail on initial load
    } finally {
      setLoading(false);
    }
  }, [contentId]);

  React.useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  async function handlePost() {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      await apiPost(`/api/content/${contentId}/comments`, {
        body: newComment.trim(),
      });
      setNewComment('');
      await fetchComments();
    } catch {
      toast({ title: 'Error', description: 'Failed to post comment', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  }

  const unresolvedCount = comments.filter((c) => !c.resolved).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          Comments
          {unresolvedCount > 0 && (
            <span className="ml-auto text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              {unresolvedCount}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* New Comment Input */}
        <div className="flex items-center gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="text-sm h-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !posting) handlePost();
            }}
          />
          <Button
            size="sm"
            className="h-8 shrink-0"
            onClick={handlePost}
            disabled={posting || !newComment.trim()}
          >
            {posting ? <CcdSpinner size="sm" /> : <Send className="h-3.5 w-3.5" />}
          </Button>
        </div>

        {/* Comments List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <CcdSpinner size="sm" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No comments yet. Start a conversation.
          </p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                contentId={contentId}
                currentUserId={currentUserId}
                onRefresh={fetchComments}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
