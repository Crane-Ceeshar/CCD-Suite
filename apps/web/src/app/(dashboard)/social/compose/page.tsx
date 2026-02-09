'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, CardContent, CardHeader, CardTitle, Button, Label, CcdSpinner, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from '@ccd/ui';
import { Send, Calendar, ImagePlus, Sparkles } from 'lucide-react';
import { apiGet, apiPost } from '@/lib/api';
import { AiGenerateButton } from '@/components/ai/ai-generate-button';
import type { SocialCampaign } from '@ccd/shared/types/social';

interface ModuleContext {
  context_type: string;
  context_data: Record<string, unknown>;
  created_at: string;
}

interface ContentSettings {
  aiTone: string;
  brandVoice: string;
}

const platforms = [
  { id: 'facebook', label: 'Facebook', color: '#1877F2', maxChars: 63206 },
  { id: 'instagram', label: 'Instagram', color: '#E4405F', maxChars: 2200 },
  { id: 'twitter', label: 'X (Twitter)', color: '#000000', maxChars: 280 },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', maxChars: 3000 },
  { id: 'tiktok', label: 'TikTok', color: '#000000', maxChars: 2200 },
  { id: 'youtube', label: 'YouTube', color: '#FF0000', maxChars: 5000 },
];

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<SocialCampaign[]>([]);
  const [saving, setSaving] = useState(false);
  const [suggestingHashtags, setSuggestingHashtags] = useState(false);

  // AI learning context
  const activityContextRef = useRef<string>('');
  const brandSettingsRef = useRef<ContentSettings>({ aiTone: 'professional', brandVoice: '' });

  useEffect(() => {
    apiGet<SocialCampaign[]>('/api/social/campaigns')
      .then((res) => setCampaigns(res.data))
      .catch(() => {});

    // Fetch recent activity context for AI learning
    apiGet<ModuleContext[]>('/api/ai/module-context?module=social&context_type=post_published&limit=10')
      .then((res) => {
        const activities = res.data;
        if (activities && activities.length > 0) {
          const platformCounts: Record<string, number> = {};
          let totalLength = 0;
          let campaignCount = 0;
          activities.forEach((a) => {
            const data = a.context_data;
            const platforms = (data.platforms as string[]) ?? [];
            platforms.forEach((p) => { platformCounts[p] = (platformCounts[p] || 0) + 1; });
            totalLength += (data.content_length as number) ?? 0;
            if (data.has_campaign) campaignCount++;
          });
          const topPlatforms = Object.entries(platformCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([p]) => p);
          const avgLength = Math.round(totalLength / activities.length);
          activityContextRef.current =
            `Based on the user's recent posting history: they most commonly post on ${topPlatforms.join(', ')}, ` +
            `average post length is ${avgLength} characters, ` +
            `and ${campaignCount}/${activities.length} recent posts were part of campaigns. ` +
            `Tailor the tone and style to match their patterns.`;
        }
      })
      .catch(() => {});

    // Fetch brand voice settings
    apiGet<{ value: ContentSettings }>('/api/settings/module?module=social&key=content.preferences')
      .then((res) => {
        if (res.data?.value) {
          brandSettingsRef.current = res.data.value;
        }
      })
      .catch(() => {});
  }, []);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const minMaxChars =
    selectedPlatforms.length > 0
      ? Math.min(
          ...selectedPlatforms.map(
            (p) => platforms.find((pl) => pl.id === p)?.maxChars || 5000
          )
        )
      : 5000;

  const selectedCampaign = campaigns.find((c) => c.id === campaignId);

  async function handleSuggestHashtags() {
    if (!content.trim()) return;
    setSuggestingHashtags(true);
    try {
      const res = await apiPost<{ results: { keywords?: string[] } }>('/api/ai/analyze', {
        text: content,
        analyses: ['keywords'],
      });
      const keywords = res.data?.results?.keywords;
      if (keywords && keywords.length > 0) {
        const hashtags = keywords.map((k: string) => `#${k.replace(/\s+/g, '')}`).join(' ');
        setContent((prev) => prev.trimEnd() + '\n\n' + hashtags);
        toast({ title: 'Hashtags added', description: `${keywords.length} hashtags suggested by AI` });
      } else {
        toast({ title: 'No hashtags found', description: 'AI could not suggest hashtags for this content', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'AI unavailable', description: 'AI service is not available. Please ensure the AI gateway is running.', variant: 'destructive' });
    } finally {
      setSuggestingHashtags(false);
    }
  }

  function logActivity(action: string) {
    apiPost('/api/ai/module-context', {
      module: 'social',
      context_type: action === 'published' ? 'post_published' : 'post_drafted',
      context_data: {
        platforms: selectedPlatforms,
        content_length: content.length,
        has_campaign: !!campaignId,
      },
    }).catch(() => {});
  }

  async function handlePublish() {
    if (!content.trim() || selectedPlatforms.length === 0) {
      alert('Please add content and select at least one platform');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/api/social/posts', {
        content: content.trim(),
        platforms: selectedPlatforms,
        status: 'published',
        published_at: new Date().toISOString(),
        campaign_id: campaignId || null,
      });
      logActivity('published');
      alert('Post published successfully!');
      router.push('/social/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to publish');
    } finally {
      setSaving(false);
    }
  }

  async function handleSchedule() {
    if (!content.trim() || selectedPlatforms.length === 0) {
      alert('Please add content and select at least one platform');
      return;
    }
    if (!scheduledAt) {
      alert('Please select a schedule date and time');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/api/social/posts', {
        content: content.trim(),
        platforms: selectedPlatforms,
        status: 'scheduled',
        scheduled_at: new Date(scheduledAt).toISOString(),
        campaign_id: campaignId || null,
      });
      logActivity('scheduled');
      alert('Post scheduled successfully!');
      router.push('/social/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to schedule');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft() {
    if (!content.trim() || selectedPlatforms.length === 0) {
      alert('Please add content and select at least one platform');
      return;
    }
    setSaving(true);
    try {
      await apiPost('/api/social/posts', {
        content: content.trim(),
        platforms: selectedPlatforms,
        status: 'draft',
        campaign_id: campaignId || null,
      });
      logActivity('draft');
      alert('Draft saved successfully!');
      router.push('/social/posts');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compose Post"
        description="Create and schedule posts across platforms"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Platform selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Platforms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      selectedPlatforms.includes(platform.id)
                        ? 'text-white border-transparent'
                        : 'text-foreground border-border hover:bg-muted'
                    }`}
                    style={
                      selectedPlatforms.includes(platform.id)
                        ? { backgroundColor: platform.color }
                        : {}
                    }
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {/* AI action buttons */}
                <div className="flex items-center gap-2 mb-3">
                  <AiGenerateButton
                    label="Generate with AI"
                    type="social_caption"
                    module="social"
                    disabled={selectedPlatforms.length === 0}
                    promptBuilder={() => {
                      const platformNames = selectedPlatforms
                        .map((p) => platforms.find((pl) => pl.id === p)?.label)
                        .filter(Boolean)
                        .join(', ');
                      let prompt = `Generate an engaging social media post for ${platformNames || 'social media'}.`;
                      if (selectedCampaign) {
                        prompt += ` This is for the campaign: "${selectedCampaign.name}".`;
                      }
                      prompt += ` Keep it under ${minMaxChars} characters.`;
                      // Add brand voice context from settings
                      const { aiTone, brandVoice } = brandSettingsRef.current;
                      if (aiTone && aiTone !== 'professional') {
                        prompt += ` Use a ${aiTone} tone.`;
                      }
                      if (brandVoice) {
                        prompt += ` Brand voice guidelines: ${brandVoice}.`;
                      }
                      // Add learning context from past activities
                      if (activityContextRef.current) {
                        prompt += ` ${activityContextRef.current}`;
                      }
                      return prompt;
                    }}
                    onResult={(text) => setContent(text)}
                  />
                  {content.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSuggestHashtags}
                      disabled={suggestingHashtags}
                      type="button"
                    >
                      {suggestingHashtags ? (
                        <CcdSpinner size="sm" className="mr-2" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Suggest Hashtags
                    </Button>
                  )}
                  {content.trim() && (
                    <AiGenerateButton
                      label="Improve"
                      type="social_caption"
                      module="social"
                      promptBuilder={() => {
                        let prompt = `Improve and enhance the following social media post while keeping the same message and tone:\n\n${content}`;
                        const { aiTone, brandVoice } = brandSettingsRef.current;
                        if (brandVoice) {
                          prompt += `\n\nBrand voice guidelines: ${brandVoice}`;
                        }
                        if (aiTone && aiTone !== 'professional') {
                          prompt += `\nUse a ${aiTone} tone.`;
                        }
                        return prompt;
                      }}
                      onResult={(text) => setContent(text)}
                    />
                  )}
                </div>

                <textarea
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="What would you like to share?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={minMaxChars}
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>
                    {content.length} / {minMaxChars.toLocaleString()} characters
                  </span>
                  {selectedPlatforms.length === 0 && (
                    <span>Select platforms above</span>
                  )}
                </div>
              </div>

              <div>
                <Label>Media</Label>
                <button className="flex items-center gap-2 px-4 py-8 w-full rounded-md border-2 border-dashed border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50 transition-colors">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-sm">Add images or videos</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Campaign selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={campaignId} onValueChange={setCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="No campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">No campaign</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose when to publish your post
              </p>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="space-y-2">
                <Button className="w-full" onClick={handlePublish} disabled={saving}>
                  {saving ? (
                    <CcdSpinner size="sm" className="mr-2" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publish Now
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSchedule}
                  disabled={saving}
                >
                  {saving ? (
                    <CcdSpinner size="sm" className="mr-2" />
                  ) : (
                    <Calendar className="mr-2 h-4 w-4" />
                  )}
                  Schedule
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleSaveDraft}
                  disabled={saving}
                >
                  Save as Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {content ? (
                <p className="text-sm whitespace-pre-wrap">{content}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Start typing to see preview
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
