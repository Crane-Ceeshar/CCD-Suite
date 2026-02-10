'use client';

import * as React from 'react';
import { MediaGrid } from '@/components/content/media-grid';
import { PageHeader, Button, Input, Badge, toast } from '@ccd/ui';
import { Search, Upload, X } from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';

// ── Types ──────────────────────────────────────────────────────────

interface MediaAsset {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  tags: string[];
  created_at: string;
}

interface MediaListResponse {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

// ── Page ───────────────────────────────────────────────────────────

export default function MediaLibraryPage() {
  const [assets, setAssets] = React.useState<MediaAsset[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [tagFilter, setTagFilter] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState('');
  const limit = 20;

  const fetchAssets = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set('search', search);
      if (tagFilter.length > 0) params.set('tags', tagFilter.join(','));

      const res = await apiGet<MediaListResponse>(`/api/media?${params.toString()}`);
      setAssets(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to load media',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, tagFilter]);

  React.useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/media/${id}`);
      setAssets((prev) => prev.filter((a) => a.id !== id));
      setTotal((prev) => prev - 1);
      toast({ title: 'Deleted', description: 'Asset removed from library.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete',
        variant: 'destructive',
      });
    }
  }

  async function handleUpdateTags(id: string, tags: string[]) {
    try {
      await apiPatch(`/api/media/${id}`, { tags });
      setAssets((prev) =>
        prev.map((a) => (a.id === id ? { ...a, tags } : a))
      );
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update tags',
        variant: 'destructive',
      });
    }
  }

  function addTagFilter() {
    const tag = tagInput.trim();
    if (tag && !tagFilter.includes(tag)) {
      setTagFilter((prev) => [...prev, tag]);
      setPage(1);
    }
    setTagInput('');
  }

  function removeTagFilter(tag: string) {
    setTagFilter((prev) => prev.filter((t) => t !== tag));
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Media Library"
        description="Browse, search, and manage your media assets"
        actions={
          <Button size="sm" disabled>
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search files..."
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTagFilter();
              }
            }}
            placeholder="Filter by tag..."
            className="h-9 w-40"
          />
          <Button variant="outline" size="sm" onClick={addTagFilter} disabled={!tagInput.trim()}>
            Add
          </Button>
        </div>
      </div>

      {/* Active tag filters */}
      {tagFilter.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Tags:</span>
          {tagFilter.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs gap-1">
              {tag}
              <button onClick={() => removeTagFilter(tag)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs"
            onClick={() => {
              setTagFilter([]);
              setPage(1);
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Grid */}
      <MediaGrid
        assets={assets}
        isLoading={loading}
        onDelete={handleDelete}
        onUpdateTags={handleUpdateTags}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
