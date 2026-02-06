'use client';

import { useState } from 'react';
import { PageHeader, Card, CardContent, Badge, Button } from '@ccd/ui';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'outline' },
  publishing: { label: 'Publishing', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function SocialPostsPage() {
  const [posts] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const filteredPosts = filter === 'all' ? posts : posts.filter(p => p.status === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posts"
        description="View and manage all social media posts"
      >
        <Link href="/social/compose">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </Link>
      </PageHeader>

      <div className="flex gap-2">
        {['all', 'draft', 'scheduled', 'published', 'failed'].map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : statusConfig[status]?.label}
          </Button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No posts yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first social media post
            </p>
            <Link href="/social/compose">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Compose Post
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredPosts.map((post) => {
            const config = statusConfig[post.status];
            return (
              <Card key={post.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm truncate">{post.content || 'No content'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {post.platforms?.map((p: string) => (
                        <span key={p} className="text-xs text-muted-foreground capitalize">{p}</span>
                      ))}
                      {post.scheduled_at && (
                        <span className="text-xs text-muted-foreground">
                          · {new Date(post.scheduled_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge variant={config?.variant}>{config?.label}</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
