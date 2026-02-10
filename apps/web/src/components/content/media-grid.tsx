'use client';

import * as React from 'react';
import { Card, CardContent, Badge, Button, Input, ConfirmationDialog } from '@ccd/ui';
import { Image as ImageIcon, File, Film, Music, Trash2, Tag, Loader2 } from 'lucide-react';

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

interface MediaGridProps {
  assets: MediaAsset[];
  isLoading?: boolean;
  onDelete: (id: string) => void;
  onUpdateTags: (id: string, tags: string[]) => void;
}

// ── Helpers ─────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return ImageIcon;
  if (fileType.startsWith('video/')) return Film;
  if (fileType.startsWith('audio/')) return Music;
  return File;
}

// ── Asset Card ──────────────────────────────────────────────────────

function AssetCard({
  asset,
  onDelete,
  onUpdateTags,
}: {
  asset: MediaAsset;
  onDelete: () => void;
  onUpdateTags: (tags: string[]) => void;
}) {
  const [editingTags, setEditingTags] = React.useState(false);
  const [tagInput, setTagInput] = React.useState('');
  const FileIcon = getFileIcon(asset.file_type);

  function handleAddTag() {
    const tag = tagInput.trim();
    if (tag && !asset.tags.includes(tag)) {
      onUpdateTags([...asset.tags, tag]);
    }
    setTagInput('');
  }

  function handleRemoveTag(tag: string) {
    onUpdateTags(asset.tags.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
    if (e.key === 'Escape') {
      setEditingTags(false);
      setTagInput('');
    }
  }

  return (
    <Card className="group overflow-hidden">
      {/* Thumbnail / Icon */}
      <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
        {asset.thumbnail_url || asset.file_type.startsWith('image/') ? (
          <img
            src={asset.thumbnail_url || asset.url}
            alt={asset.alt_text || asset.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileIcon className="h-10 w-10 text-muted-foreground" />
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditingTags(!editingTags)}
          >
            <Tag className="h-3.5 w-3.5 mr-1" />
            Tags
          </Button>
          <ConfirmationDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            }
            title="Delete Asset"
            description={`Delete "${asset.file_name}"? This cannot be undone.`}
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={onDelete}
          />
        </div>
      </div>

      <CardContent className="p-3 space-y-2">
        {/* File info */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" title={asset.file_name}>
              {asset.file_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {asset.file_type.split('/')[1]?.toUpperCase() ?? asset.file_type} &middot; {formatFileSize(asset.file_size)}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {asset.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[10px] cursor-pointer hover:bg-destructive/20"
              onClick={() => editingTags && handleRemoveTag(tag)}
            >
              {tag}
              {editingTags && <span className="ml-1">&times;</span>}
            </Badge>
          ))}
        </div>

        {/* Tag editing input */}
        {editingTags && (
          <div className="flex gap-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag..."
              className="h-7 text-xs"
            />
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Grid ──────────────────────────────────────────────────────

export function MediaGrid({ assets, isLoading, onDelete, onUpdateTags }: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <ImageIcon className="h-10 w-10 mb-3 opacity-50" />
        <p className="text-sm">No media assets found</p>
        <p className="text-xs mt-1">Upload files to build your media library</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onDelete={() => onDelete(asset.id)}
          onUpdateTags={(tags) => onUpdateTags(asset.id, tags)}
        />
      ))}
    </div>
  );
}
