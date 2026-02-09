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
  Input,
  FormField,
  CcdSpinner,
} from '@ccd/ui';
import { apiPost, apiPatch } from '@/lib/api';

interface KeywordFormData {
  keyword: string;
  search_volume: string;
  difficulty: string;
  target_rank: string;
  url: string;
  tags: string;
}

interface KeywordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  keyword?: {
    id: string;
    keyword: string;
    search_volume: number | null;
    difficulty: number | null;
    target_rank: number | null;
    url: string | null;
    tags: string[];
  } | null;
  onSuccess: () => void;
}

const initialForm: KeywordFormData = {
  keyword: '',
  search_volume: '',
  difficulty: '',
  target_rank: '',
  url: '',
  tags: '',
};

export function KeywordDialog({ open, onOpenChange, projectId, keyword, onSuccess }: KeywordDialogProps) {
  const [form, setForm] = React.useState<KeywordFormData>(initialForm);
  const [bulkMode, setBulkMode] = React.useState(false);
  const [bulkText, setBulkText] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const isEdit = !!keyword;

  React.useEffect(() => {
    if (open) {
      if (keyword) {
        setForm({
          keyword: keyword.keyword,
          search_volume: keyword.search_volume != null ? String(keyword.search_volume) : '',
          difficulty: keyword.difficulty != null ? String(keyword.difficulty) : '',
          target_rank: keyword.target_rank != null ? String(keyword.target_rank) : '',
          url: keyword.url ?? '',
          tags: keyword.tags?.join(', ') ?? '',
        });
        setBulkMode(false);
      } else {
        setForm(initialForm);
        setBulkText('');
      }
      setError('');
    }
  }, [open, keyword]);

  function update(field: keyof KeywordFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (bulkMode && !isEdit) {
        const keywords = bulkText
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        if (keywords.length === 0) {
          setError('Enter at least one keyword');
          setSaving(false);
          return;
        }
        for (const kw of keywords) {
          await apiPost('/api/seo/keywords', {
            project_id: projectId,
            keyword: kw,
          });
        }
      } else {
        if (!form.keyword.trim()) {
          setError('Keyword is required');
          setSaving(false);
          return;
        }

        const payload: Record<string, unknown> = {
          project_id: projectId,
          keyword: form.keyword.trim(),
          search_volume: form.search_volume ? parseInt(form.search_volume) : null,
          difficulty: form.difficulty ? parseInt(form.difficulty) : null,
          target_rank: form.target_rank ? parseInt(form.target_rank) : null,
          url: form.url.trim() || null,
          tags: form.tags
            ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
            : [],
        };

        if (isEdit) {
          await apiPatch(`/api/seo/keywords/${keyword!.id}`, payload);
        } else {
          await apiPost('/api/seo/keywords', payload);
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save keyword');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Keyword' : 'Add Keywords'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update keyword details' : 'Add keywords to track rankings'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={!bulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkMode(false)}
              >
                Single
              </Button>
              <Button
                type="button"
                variant={bulkMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkMode(true)}
              >
                Bulk
              </Button>
            </div>
          )}

          {bulkMode && !isEdit ? (
            <FormField label="Keywords (one per line)">
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={"best seo tools\nkeyword research\ncontent marketing strategy"}
              />
            </FormField>
          ) : (
            <>
              <FormField label="Keyword" required>
                <Input
                  value={form.keyword}
                  onChange={(e) => update('keyword', e.target.value)}
                  placeholder="e.g. best seo tools"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Search Volume">
                  <Input
                    type="number"
                    value={form.search_volume}
                    onChange={(e) => update('search_volume', e.target.value)}
                    placeholder="0"
                  />
                </FormField>
                <FormField label="Difficulty (0-100)">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={form.difficulty}
                    onChange={(e) => update('difficulty', e.target.value)}
                    placeholder="0"
                  />
                </FormField>
              </div>
              <FormField label="Target Rank">
                <Input
                  type="number"
                  value={form.target_rank}
                  onChange={(e) => update('target_rank', e.target.value)}
                  placeholder="e.g. 10"
                />
              </FormField>
              <FormField label="URL">
                <Input
                  value={form.url}
                  onChange={(e) => update('url', e.target.value)}
                  placeholder="https://example.com/page"
                />
              </FormField>
              <FormField label="Tags (comma-separated)">
                <Input
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="seo, tools, review"
                />
              </FormField>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              {isEdit ? 'Save Changes' : bulkMode ? 'Add Keywords' : 'Add Keyword'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
