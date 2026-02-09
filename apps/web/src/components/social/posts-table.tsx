'use client';

import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CcdLoader,
  DataTable,
  Input,
  toast,
  type Column,
} from '@ccd/ui';
import { Pencil, Trash2, FileText, Search } from 'lucide-react';
import { apiDelete, apiPatch } from '@/lib/api';
import { PostDialog } from './post-dialog';
import type { SocialPost } from '@ccd/shared/types/social';

type PostRow = SocialPost & Record<string, unknown>;

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
  const [localPosts, setLocalPosts] = React.useState<PostRow[]>([]);

  // Sync localPosts from the posts prop
  React.useEffect(() => {
    setLocalPosts(posts as PostRow[]);
  }, [posts]);

  const filtered = React.useMemo(() => {
    let result = localPosts;
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => (p.content ?? '').toLowerCase().includes(q));
    }
    return result;
  }, [localPosts, statusFilter, search]);

  async function handleCellEdit(item: PostRow, key: string, value: unknown) {
    setLocalPosts((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, [key]: value } : c))
    );
    try {
      await apiPatch(`/api/social/posts/${item.id}`, { [key]: value });
      toast({ title: 'Post updated' });
    } catch {
      setLocalPosts((prev) =>
        prev.map((c) => (c.id === item.id ? item : c))
      );
      toast({ title: 'Failed to update post', variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiDelete(`/api/social/posts/${id}`);
      onRefresh();
    } catch {
      toast({ title: 'Failed to delete post', variant: 'destructive' });
    }
  }

  const columns: Column<PostRow>[] = [
    {
      key: 'content',
      header: 'Content',
      editable: true,
      editType: 'text',
      render: (post) => (
        <p className="truncate max-w-[300px]">
          {post.content
            ? post.content.length > 60
              ? post.content.slice(0, 60) + '...'
              : post.content
            : 'No content'}
        </p>
      ),
    },
    {
      key: 'platforms',
      header: 'Platforms',
      render: (post) => (
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
      ),
    },
    {
      key: 'status',
      header: 'Status',
      editable: true,
      editType: 'select',
      editOptions: [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'published', label: 'Published' },
        { value: 'failed', label: 'Failed' },
      ],
      render: (post) => {
        const config = statusConfig[post.status];
        return <Badge variant={config?.variant}>{config?.label ?? post.status}</Badge>;
      },
    },
    {
      key: 'scheduled_at',
      header: 'Scheduled',
      sortable: true,
      render: (post) => (
        <span className="text-muted-foreground">
          {post.scheduled_at
            ? new Date(post.scheduled_at).toLocaleDateString()
            : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[100px]',
      render: (post) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
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
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(post.id);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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

      {/* Table or Empty State */}
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
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          onCellEdit={handleCellEdit}
          emptyMessage="No posts found"
          loading={false}
        />
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
