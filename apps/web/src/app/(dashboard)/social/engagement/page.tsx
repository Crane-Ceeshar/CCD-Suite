'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button, CcdLoader, CcdSpinner, toast } from '@ccd/ui';
import { MessageCircle, ThumbsUp, Share, Eye, Sparkles, RefreshCw } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { CommentReplyDialog } from '@/components/social/comment-reply-dialog';
import { EngagementChart } from '@/components/social/engagement-chart';
import type { SocialComment } from '@ccd/shared/types/social';

const sentimentConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  positive: { label: 'Positive', variant: 'default' },
  neutral: { label: 'Neutral', variant: 'secondary' },
  negative: { label: 'Negative', variant: 'destructive' },
};

interface EngagementTotals {
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  reach: number;
  clicks: number;
  total_engagement: number;
  engagement_rate: number;
}

const emptyTotals: EngagementTotals = {
  likes: 0,
  comments: 0,
  shares: 0,
  impressions: 0,
  reach: 0,
  clicks: 0,
  total_engagement: 0,
  engagement_rate: 0,
};

export default function EngagementPage() {
  const [totals, setTotals] = useState<EngagementTotals>(emptyTotals);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyComment, setReplyComment] = useState<SocialComment | null>(null);
  const [replyInitialContent, setReplyInitialContent] = useState<string | undefined>(undefined);
  const [suggestingReplyId, setSuggestingReplyId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await apiPost<{ synced_at: string; analytics: { synced: number }; comments: { new_comments: number } }>('/api/social/analytics/sync', {});
      setLastSynced(res.data?.synced_at ?? new Date().toISOString());
      toast({
        title: 'Sync complete',
        description: `${res.data?.analytics?.synced ?? 0} posts synced, ${res.data?.comments?.new_comments ?? 0} new comments`,
      });
      fetchData();
    } catch (err) {
      toast({ title: 'Sync failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [engRes, comRes] = await Promise.all([
        apiGet<EngagementTotals>('/api/social/engagement'),
        apiGet<SocialComment[]>('/api/social/comments'),
      ]);
      setTotals(engRes.data ?? emptyTotals);
      setComments(Array.isArray(comRes.data) ? comRes.data : []);
    } catch (err) {
      toast({ title: 'Failed to load engagement data', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openReply(comment: SocialComment, prefilledContent?: string) {
    setReplyComment(comment);
    setReplyInitialContent(prefilledContent);
    setReplyDialogOpen(true);
  }

  async function handleSuggestReply(comment: SocialComment) {
    setSuggestingReplyId(comment.id);
    try {
      const prompt = `Suggest a professional and friendly reply to this social media comment from ${comment.author_name || 'a user'} on ${comment.platform}: '${comment.content}'. Keep the reply concise and appropriate.`;
      const res = await apiPost<{ message: { content: string } }>('/api/ai/chat', {
        content: prompt,
        module_context: 'social',
        entity_context: {
          entity_type: 'comment',
          entity_data: {
            author: comment.author_name,
            content: comment.content,
            platform: comment.platform,
            sentiment: comment.sentiment,
          },
        },
      });
      const suggestedReply = res.data?.message?.content;
      if (suggestedReply) {
        // Log AI-assisted engagement activity
        apiPost('/api/ai/module-context', {
          module: 'social',
          context_type: 'engagement_replied',
          context_data: {
            platform: comment.platform,
            ai_assisted: true,
          },
        }).catch(() => {});
        openReply(comment, suggestedReply);
      } else {
        toast({ title: 'No suggestion', description: 'AI could not generate a reply suggestion', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'AI unavailable', description: 'AI service is not available. Please ensure the AI gateway is running.', variant: 'destructive' });
    } finally {
      setSuggestingReplyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Engagement Hub"
          description="Monitor engagement and respond to comments"
        />
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engagement Hub"
        description={lastSynced ? `Last synced ${new Date(lastSynced).toLocaleString()}` : 'Monitor engagement and respond to comments'}
        actions={
          <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
            {syncing ? (
              <CcdSpinner size="sm" className="mr-2" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Sync Now
          </Button>
        }
      />

      {/* Engagement overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{totals.likes.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Likes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{totals.comments.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Share className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{totals.shares.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Shares</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{totals.impressions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Chart — shown when there is engagement data */}
      {totals.total_engagement > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Engagement Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <EngagementChart
              data={[
                { platform: 'Overview', likes: totals.likes, comments: totals.comments, shares: totals.shares },
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Comment stream */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <MessageCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No incoming comments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 rounded-lg border">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-medium shrink-0">
                    {comment.author_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {comment.author_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {comment.platform}
                      </span>
                      {comment.sentiment && sentimentConfig[comment.sentiment] && (
                        <Badge
                          variant={sentimentConfig[comment.sentiment].variant}
                          className="text-xs"
                        >
                          {sentimentConfig[comment.sentiment].label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {!comment.replied && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openReply(comment)}
                        >
                          Reply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
                          onClick={() => handleSuggestReply(comment)}
                          disabled={suggestingReplyId === comment.id}
                        >
                          {suggestingReplyId === comment.id ? (
                            <CcdSpinner size="sm" className="mr-1" />
                          ) : (
                            <Sparkles className="mr-1 h-3.5 w-3.5" />
                          )}
                          Suggest Reply
                        </Button>
                      </div>
                    )}
                    {comment.replied && comment.reply_content && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs">
                        <span className="font-medium">Your reply: </span>
                        {comment.reply_content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommentReplyDialog
        open={replyDialogOpen}
        onOpenChange={(v) => {
          setReplyDialogOpen(v);
          if (!v) {
            setReplyComment(null);
            setReplyInitialContent(undefined);
          }
        }}
        comment={replyComment}
        onSuccess={fetchData}
        initialReply={replyInitialContent}
      />
    </div>
  );
}
