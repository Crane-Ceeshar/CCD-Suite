'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader, Button, CcdLoader } from '@ccd/ui';
import { Plus } from 'lucide-react';
import { apiGet } from '@/lib/api';
import { PostsTable } from '@/components/social/posts-table';
import { PostDialog } from '@/components/social/post-dialog';
import type { SocialPost } from '@ccd/shared/types/social';

export default function SocialPostsPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<SocialPost[]>('/api/social/posts');
      setPosts(res.data);
    } catch {
      // keep empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Posts"
        description="View and manage all social media posts"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        }
      />

      {loading && posts.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <CcdLoader size="lg" />
        </div>
      ) : (
        <PostsTable posts={posts} loading={loading} onRefresh={fetchPosts} />
      )}

      <PostDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        post={null}
        onSuccess={fetchPosts}
      />
    </div>
  );
}
