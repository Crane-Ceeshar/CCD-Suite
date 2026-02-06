'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@ccd/ui';
import { MessageCircle, ThumbsUp, Share, Eye } from 'lucide-react';

const sentimentConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  positive: { label: 'Positive', variant: 'default' },
  neutral: { label: 'Neutral', variant: 'secondary' },
  negative: { label: 'Negative', variant: 'destructive' },
};

export default function EngagementPage() {
  const [comments] = useState<any[]>([]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Engagement Hub"
        description="Monitor engagement and respond to comments"
      />

      {/* Engagement overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
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
                <p className="text-2xl font-bold">0</p>
                <p className="text-xs text-muted-foreground">Impressions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                      <span className="font-medium text-sm">{comment.author_name || 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground capitalize">{comment.platform}</span>
                      {comment.sentiment && (
                        <Badge variant={sentimentConfig[comment.sentiment]?.variant} className="text-xs">
                          {sentimentConfig[comment.sentiment]?.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm">{comment.content}</p>
                    {!comment.replied && (
                      <Button variant="ghost" size="sm" className="mt-2 h-7 text-xs">
                        Reply
                      </Button>
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
    </div>
  );
}
