'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
} from '@ccd/ui';
import { apiPost, apiPatch } from '@/lib/api';
import { AiGenerateButton } from '@/components/ai/ai-generate-button';
import type { SocialPost } from '@ccd/shared/types/social';

const platformConfigs = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', maxChars: 63206 },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', maxChars: 2200 },
  { id: 'twitter', label: 'X (Twitter)', color: '#000000', maxChars: 280 },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', maxChars: 3000 },
  { id: 'tiktok', label: 'TikTok', color: '#000000', maxChars: 2200 },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', maxChars: 5000 },
];

interface PostFormData {
  content: string;
  platforms: string[];
  scheduled_at: string;
  status: string;
  campaign_id: string;
}

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: SocialPost | null;
  onSuccess: () => void;
}

const initialForm: PostFormData = {
  content: '',
  platforms: [],
  scheduled_at: '',
  status: 'draft',
  campaign_id: '',
};

export function PostDialog({ open, onOpenChange, post, onSuccess }: PostDialogProps) {
  const [form, setForm] = React.useState<PostFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!post;

  React.useEffect(() => {
    if (open) {
      if (post) {
        setForm({
          content: post.content ?? '',
          platforms: post.platforms ?? [],
          scheduled_at: post.scheduled_at
            ? new Date(post.scheduled_at).toISOString().slice(0, 16)
            : '',
          status: post.status,
          campaign_id: post.campaign_id ?? '',
        });
      } else {
        setForm(initialForm);
      }
      setError('');
    }
  }, [open, post]);

  function togglePlatform(id: string) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(id)
        ? prev.platforms.filter((p) => p !== id)
        : [...prev.platforms, id],
    }));
  }

  const minMaxChars =
    form.platforms.length > 0
      ? Math.min(
          ...form.platforms.map(
            (p) => platformConfigs.find((pl) => pl.id === p)?.maxChars ?? 5000
          )
        )
      : 5000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.content.trim()) {
      setError('Post content is required');
      return;
    }
    if (form.platforms.length === 0) {
      setError('Select at least one platform');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        content: form.content.trim(),
        platforms: form.platforms,
        scheduled_at: form.scheduled_at || null,
        status: form.status,
        campaign_id: form.campaign_id || null,
      };

      if (isEdit) {
        await apiPatch(`/api/social/posts/${post!.id}`, payload);
      } else {
        await apiPost('/api/social/posts', payload);
      }
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Post' : 'New Post'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update your social media post' : 'Create a new social media post'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Platform selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {platformConfigs.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    form.platforms.includes(platform.id)
                      ? 'text-white border-transparent'
                      : 'text-foreground border-border hover:bg-muted'
                  }`}
                  style={
                    form.platforms.includes(platform.id)
                      ? { backgroundColor: platform.color }
                      : {}
                  }
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <FormField label="Content" required>
            <textarea
              value={form.content}
              onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="What would you like to share?"
              maxLength={minMaxChars}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">
                {form.content.length} / {minMaxChars.toLocaleString()} characters
              </p>
              <AiGenerateButton
                label="AI Assist"
                type="social_caption"
                module="social"
                size="sm"
                variant="ghost"
                promptBuilder={() => {
                  const platformNames = form.platforms
                    .map((p) => platformConfigs.find((pl) => pl.id === p)?.label)
                    .filter(Boolean)
                    .join(', ');
                  if (form.content.trim()) {
                    return `Improve this social media post: ${form.content}`;
                  }
                  return `Generate a social media post for ${platformNames || 'social media'}`;
                }}
                onResult={(text) => setForm((prev) => ({ ...prev, content: text }))}
              />
            </div>
          </FormField>

          {/* Schedule */}
          <FormField label="Schedule">
            <input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, scheduled_at: e.target.value }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </FormField>

          {/* Status */}
          <FormField label="Status">
            <Select
              value={form.status}
              onValueChange={(v) => setForm((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : 'Create Post'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
