'use client';

import * as React from 'react';
import { Badge, Button, Card, CardContent, Input, CcdLoader } from '@ccd/ui';
import { Pencil, Trash2, FileText, Search } from 'lucide-react';
import { apiDelete } from '@/lib/api';
import { PostDialog } from './post-dialog';
import type { SocialPost } from '@ccd/shared/types/social';

const platformColors: Record<string, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  twitter: '#000000',
  linkedin: '#0A66C2',
  tiktok: '#000000',
  youtube: '#FF0000',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'outline' },
  publishing: { label: 'Publishing', variant: 'secondary' },
  published: { label: 'Published', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

interface PostsTableProps {
  posts: SocialPost[];
  loading: boolean;
  onRefresh: () => void;
}

export function PostsTable({ posts, loading, onRefresh }: PostsTableProps) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [editPost, setEditPost] = React.useState<SocialPost | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    let result = posts;
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => (p.content ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [posts, statusFilter, search]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiDelete(`/api/social/posts/${id}`);
      onRefresh();
    } catch {
      alert('Failed to delete post');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="md" />
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'draft', 'scheduled', 'published', 'failed'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : statusConfig[s]?.label ?? s}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">No posts found</h3>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first social media post'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Content</th>
                <th className="text-left font-medium px-4 py-3">Platforms</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Scheduled</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => {
                const config = statusConfig[post.status];
                return (
                  <tr key={post.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 max-w-[300px]">
                      <p className="truncate">
                        {post.content
                          ? post.content.length > 60
                            ? post.content.slice(0, 60) + '...'
                            : post.content
                          : 'No content'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(post.platforms ?? []).map((p) => (
                          <span
                            key={p}
                            className="inline-block px-2 py-0.5 rounded-full text-xs text-white font-medium"
                            style={{ backgroundColor: platformColors[p] ?? '#888' }}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={config?.variant}>{config?.label ?? post.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {post.scheduled_at
                        ? new Date(post.scheduled_at).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditPost(post);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PostDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditPost(null);
        }}
        post={editPost}
        onSuccess={onRefresh}
      />
    </>
  );
}
