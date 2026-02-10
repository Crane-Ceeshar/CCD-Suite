'use client';

import * as React from 'react';
import {
  PageHeader,
  Button,
  Input,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  StatusBadge,
  CcdLoader,
  CcdSpinner,
  toast,
} from '@ccd/ui';
import { Save, Send, ArrowLeft, Eye, Sparkles, Wand2, Check, AlertTriangle, History, Copy, MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGet, apiPost, apiPatch } from '@/lib/api';
import { TipTapEditor } from '@/components/content/tiptap-editor';
import { VersionHistory } from '@/components/content/version-history';
import { CommentSidebar } from '@/components/content/comment-sidebar';
import { ContentAnalyticsCard } from '@/components/content/content-analytics-card';
import { getValidNextStatuses, type ContentStatus } from '@/lib/content/status-machine';
import { useAuthStore } from '@/stores/auth-store';

const CONTENT_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'social_post', label: 'Social Post' },
  { value: 'email', label: 'Email' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'ad_copy', label: 'Ad Copy' },
  { value: 'video_script', label: 'Video Script' },
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  review: 'In Review',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  archived: 'Archived',
};

interface CategoryOption {
  id: string;
  name: string;
  color: string | null;
}

interface ContentForm {
  title: string;
  slug: string;
  content_type: string;
  body: string;
  excerpt: string;
  status: string;
  publish_date: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  category_id: string;
}

const initialForm: ContentForm = {
  title: '',
  slug: '',
  content_type: 'article',
  body: '',
  excerpt: '',
  status: 'draft',
  publish_date: '',
  tags: '',
  seo_title: '',
  seo_description: '',
  category_id: '',
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved';

export default function ContentEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentId = searchParams.get('id');
  const templateId = searchParams.get('template');

  const [form, setForm] = React.useState<ContentForm>(initialForm);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [loading, setLoading] = React.useState(!!contentId);
  const [saving, setSaving] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>('idle');
  const [showAiPanel, setShowAiPanel] = React.useState(false);
  const [showVersionHistory, setShowVersionHistory] = React.useState(false);
  const [showComments, setShowComments] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState('');
  const currentUser = useAuthStore((s) => s.user);
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [initialStatus, setInitialStatus] = React.useState<string>('draft');
  const autoSaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = React.useRef<string>('');
  const updatedAtRef = React.useRef<string | null>(null);
  const savedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories
  React.useEffect(() => {
    apiGet<CategoryOption[]>('/api/content/categories')
      .then((res) => setCategories(res.data ?? []))
      .catch(() => {});
  }, []);

  // Load content if editing
  React.useEffect(() => {
    if (!contentId) return;
    async function load() {
      try {
        const res = await apiGet<{
          title: string;
          slug: string;
          content_type: string;
          body: string | null;
          excerpt: string | null;
          status: string;
          publish_date: string | null;
          tags: string[];
          seo_title: string | null;
          seo_description: string | null;
          category_id: string | null;
          updated_at?: string;
        }>(`/api/content/${contentId}`);
        const d = res.data;
        setForm({
          title: d.title ?? '',
          slug: d.slug ?? '',
          content_type: d.content_type ?? 'article',
          body: d.body ?? '',
          excerpt: d.excerpt ?? '',
          status: d.status ?? 'draft',
          publish_date: d.publish_date ? d.publish_date.slice(0, 10) : '',
          tags: (d.tags ?? []).join(', '),
          seo_title: d.seo_title ?? '',
          seo_description: d.seo_description ?? '',
          category_id: d.category_id ?? '',
        });
        setInitialStatus(d.status ?? 'draft');
        updatedAtRef.current = d.updated_at ?? null;
        savedRef.current = JSON.stringify(d);
      } catch {
        toast({ title: 'Error', description: 'Failed to load content', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [contentId]);

  // Load template if ?template=<id> is in the URL
  React.useEffect(() => {
    if (!templateId || contentId) return;
    async function loadTemplate() {
      try {
        const res = await apiGet<{
          body_template?: string;
          content_type?: string;
          metadata_template?: Record<string, unknown>;
        }>(`/api/content/templates/${templateId}`);
        const t = res.data;
        setForm((prev) => {
          const next = { ...prev };
          if (t.body_template) next.body = t.body_template;
          if (t.content_type) next.content_type = t.content_type;
          if (t.metadata_template) {
            const m = t.metadata_template;
            if (typeof m.seo_title === 'string') next.seo_title = m.seo_title;
            if (typeof m.seo_description === 'string') next.seo_description = m.seo_description;
            if (typeof m.excerpt === 'string') next.excerpt = m.excerpt;
            if (typeof m.category_id === 'string') next.category_id = m.category_id;
            if (Array.isArray(m.tags)) next.tags = m.tags.join(', ');
            if (typeof m.status === 'string') next.status = m.status;
          }
          return next;
        });
        toast({ title: 'Template loaded', description: 'Template content applied to editor' });
      } catch {
        toast({ title: 'Error', description: 'Failed to load template', variant: 'destructive' });
      }
    }
    loadTemplate();
  }, [templateId, contentId]);

  function update(field: keyof ContentForm, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === 'title' && !contentId) {
        next.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      }
      return next;
    });
    setIsDirty(true);
    setSaveStatus('unsaved');
  }

  // Auto-save draft every 30 seconds — includes ALL metadata fields
  React.useEffect(() => {
    if (!isDirty || !contentId || form.status !== 'draft') return;
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const autoSavePayload: Record<string, unknown> = {
          title: form.title,
          body: form.body,
          excerpt: form.excerpt,
          slug: form.slug,
          content_type: form.content_type,
          status: form.status,
          publish_date: form.publish_date || null,
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          seo_title: form.seo_title || null,
          seo_description: form.seo_description || null,
          category_id: form.category_id || null,
        };
        if (updatedAtRef.current) {
          autoSavePayload.expected_updated_at = updatedAtRef.current;
        }
        const res = await apiPatch<{ updated_at?: string }>(`/api/content/${contentId}`, autoSavePayload);
        if (res.data?.updated_at) updatedAtRef.current = res.data.updated_at;
        setIsDirty(false);
        setSaveStatus('saved');
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch {
        setSaveStatus('unsaved');
      }
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [isDirty, contentId, form]);

  async function handleSave() {
    setSaving(true);
    setSaveStatus('saving');
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        content_type: form.content_type,
        body: form.body,
        excerpt: form.excerpt || (form.body ? stripHtml(form.body).slice(0, 160) : ''),
        status: form.status,
        publish_date: form.publish_date || null,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        seo_title: form.seo_title || form.title,
        seo_description: form.seo_description || null,
        category_id: form.category_id || null,
      };

      if (contentId && updatedAtRef.current) {
        payload.expected_updated_at = updatedAtRef.current;
      }

      if (contentId) {
        const res = await apiPatch<{ updated_at?: string }>(`/api/content/${contentId}`, payload);
        if (res.data?.updated_at) updatedAtRef.current = res.data.updated_at;
        setInitialStatus(form.status);
        toast({ title: 'Saved', description: 'Content updated successfully' });
      } else {
        const res = await apiPost<{ id: string }>('/api/content', payload);
        toast({ title: 'Created', description: 'Content created successfully' });
        router.push(`/content/editor?id=${res.data.id}`);
      }
      setIsDirty(false);
      setSaveStatus('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      setSaveStatus('unsaved');
      const message = err instanceof Error ? err.message : 'Failed to save';
      // Handle conflict (409)
      if (message.includes('modified') || message.includes('409')) {
        toast({
          title: 'Conflict Detected',
          description: 'This content was modified elsewhere. Reload the page to see the latest changes.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        slug: form.slug,
        content_type: form.content_type,
        body: form.body,
        excerpt: form.excerpt || (form.body ? stripHtml(form.body).slice(0, 160) : ''),
        status: 'published',
        publish_date: new Date().toISOString(),
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        seo_title: form.seo_title || form.title,
        seo_description: form.seo_description || null,
        category_id: form.category_id || null,
      };

      if (contentId && updatedAtRef.current) {
        payload.expected_updated_at = updatedAtRef.current;
      }

      if (contentId) {
        await apiPatch(`/api/content/${contentId}`, payload);
      } else {
        await apiPost('/api/content', payload);
      }
      toast({ title: 'Published', description: 'Content published successfully' });
      router.push('/content/library');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish';
      if (message.includes('modified') || message.includes('409')) {
        toast({
          title: 'Conflict Detected',
          description: 'This content was modified elsewhere. Reload the page to see the latest changes.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await apiPost<{ text?: string; content?: string }>('/api/ai/generate', {
        type: 'content',
        prompt: aiPrompt,
        content_type: form.content_type,
      });
      const generated = res.data.text ?? res.data.content ?? '';
      if (generated) {
        update('body', form.body + generated);
        setAiPrompt('');
        setShowAiPanel(false);
        toast({ title: 'Generated', description: 'AI content inserted into editor' });
      }
    } catch (err) {
      toast({
        title: 'AI Error',
        description: err instanceof Error ? err.message : 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleGenerateSeo() {
    if (!form.body && !form.title) {
      toast({ title: 'Missing content', description: 'Add a title or body first', variant: 'destructive' });
      return;
    }
    setAiGenerating(true);
    try {
      const res = await apiPost<{ seo_title?: string; seo_description?: string; title?: string; description?: string }>('/api/ai/generate', {
        type: 'seo',
        content: form.body,
        title: form.title,
      });
      const seoTitle = res.data.seo_title ?? res.data.title ?? '';
      const seoDesc = res.data.seo_description ?? res.data.description ?? '';
      if (seoTitle) update('seo_title', seoTitle);
      if (seoDesc) update('seo_description', seoDesc);
      toast({ title: 'SEO Generated', description: 'SEO fields updated with AI suggestions' });
    } catch (err) {
      toast({
        title: 'AI Error',
        description: err instanceof Error ? err.message : 'Failed to generate SEO',
        variant: 'destructive',
      });
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleDuplicate() {
    if (!contentId) return;
    try {
      const res = await apiPost<{ id: string }>(`/api/content/${contentId}/duplicate`, {});
      toast({ title: 'Duplicated', description: 'Content cloned as a new draft' });
      router.push(`/content/editor?id=${res.data.id}`);
    } catch {
      toast({ title: 'Error', description: 'Failed to duplicate content', variant: 'destructive' });
    }
  }

  function handleVersionRestore() {
    // Reload the content from API after restoring a version
    if (contentId) {
      window.location.href = `/content/editor?id=${contentId}`;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={contentId ? 'Edit Content' : 'New Content'}
        description={contentId ? form.title || 'Editing content' : 'Create a new content piece'}
        breadcrumbs={[
          { label: 'Content', href: '/content' },
          { label: 'Library', href: '/content/library' },
          { label: contentId ? 'Edit' : 'New' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {contentId && <StatusBadge status={form.status} />}
            {contentId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVersionHistory((v) => !v)}
                className={showVersionHistory ? 'border-blue-400 text-blue-600' : ''}
              >
                <History className="mr-2 h-4 w-4" />
                Versions
              </Button>
            )}
            {contentId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowComments((v) => !v)}
                className={showComments ? 'border-blue-400 text-blue-600' : ''}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Comments
              </Button>
            )}
            {contentId && (
              <Button variant="outline" size="sm" onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAiPanel((v) => !v)}
              className={showAiPanel ? 'border-purple-400 text-purple-600' : ''}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Generate
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/content/library')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <CcdSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Save Draft
            </Button>
            <Button size="sm" onClick={handlePublish} disabled={saving || !form.title}>
              {saving ? <CcdSpinner size="sm" className="mr-2" /> : <Send className="mr-2 h-4 w-4" />}
              Publish
            </Button>
          </div>
        }
      />

      {showAiPanel && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
              <Input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={`Describe what to write (e.g., "A blog post about social media marketing trends")...`}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !aiGenerating) handleAiGenerate();
                }}
              />
              <Button
                size="sm"
                onClick={handleAiGenerate}
                disabled={aiGenerating || !aiPrompt.trim()}
              >
                {aiGenerating ? (
                  <CcdSpinner size="sm" className="mr-2" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* ── Main Editor ─────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Untitled Content"
              className="text-2xl font-bold border-0 px-0 focus-visible:ring-0 shadow-none flex-1"
            />
            {saveStatus === 'saving' && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                <CcdSpinner size="sm" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-xs text-green-600 flex items-center gap-1 shrink-0">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="text-xs text-amber-600 flex items-center gap-1 shrink-0">
                <AlertTriangle className="h-3.5 w-3.5" />
                Unsaved changes
              </span>
            )}
          </div>
          <TipTapEditor
            content={form.body}
            onChange={(html) => update('body', html)}
            placeholder="Start writing your content..."
          />
        </div>

        {/* ── Sidebar ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Content Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="Content Type">
                <Select value={form.content_type} onValueChange={(v) => update('content_type', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Status">
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Current status is always shown */}
                    <SelectItem value={form.status}>
                      {STATUS_LABELS[form.status] ?? form.status}
                    </SelectItem>
                    {/* Show only valid transitions from the persisted status */}
                    {getValidNextStatuses(initialStatus as ContentStatus)
                      .filter((s) => s !== form.status)
                      .map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Category">
                <Select value={form.category_id || '__none__'} onValueChange={(v) => update('category_id', v === '__none__' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="Publish Date">
                <Input
                  type="date"
                  value={form.publish_date}
                  onChange={(e) => update('publish_date', e.target.value)}
                />
              </FormField>

              <FormField label="Tags">
                <Input
                  value={form.tags}
                  onChange={(e) => update('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="text-xs text-muted-foreground mt-1">Comma-separated</p>
              </FormField>

              <FormField label="Slug">
                <Input
                  value={form.slug}
                  onChange={(e) => update('slug', e.target.value)}
                  placeholder="auto-generated-from-title"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  SEO
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateSeo}
                  disabled={aiGenerating}
                  className="h-7 text-xs text-purple-600 hover:text-purple-700"
                >
                  {aiGenerating ? (
                    <CcdSpinner size="sm" className="mr-1" />
                  ) : (
                    <Wand2 className="mr-1 h-3 w-3" />
                  )}
                  Generate SEO
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField label="SEO Title">
                <Input
                  value={form.seo_title}
                  onChange={(e) => update('seo_title', e.target.value)}
                  placeholder={form.title || 'SEO title'}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.seo_title.length}/60 characters
                </p>
              </FormField>

              <FormField label="Meta Description">
                <textarea
                  value={form.seo_description}
                  onChange={(e) => update('seo_description', e.target.value)}
                  placeholder="Brief description for search engines..."
                  maxLength={160}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {form.seo_description.length}/160 characters
                </p>
              </FormField>

              <FormField label="Excerpt">
                <textarea
                  value={form.excerpt}
                  onChange={(e) => update('excerpt', e.target.value)}
                  placeholder="Short summary..."
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </FormField>
            </CardContent>
          </Card>

          {/* Content Analytics */}
          {contentId && <ContentAnalyticsCard contentId={contentId} />}

          {/* Version History */}
          {contentId && showVersionHistory && (
            <VersionHistory
              contentId={contentId}
              currentTitle={form.title}
              currentBody={form.body}
              onRestore={handleVersionRestore}
            />
          )}

          {/* Comments */}
          {contentId && showComments && currentUser && (
            <CommentSidebar
              contentId={contentId}
              currentUserId={currentUser.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/** Strip HTML tags for excerpt generation */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}
