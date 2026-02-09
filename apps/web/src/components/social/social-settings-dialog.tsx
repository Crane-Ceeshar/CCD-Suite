'use client';

import * as React from 'react';
import { MODULES } from '@ccd/shared';
import {
  ModuleSettingsDialog,
  type ModuleSettingsTab,
  Button,
  Label,
  Input,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
  CcdLoader,
} from '@ccd/ui';
import { Save, Share2, Users, Send, MessageCircle, Palette } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface SocialSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Accounts Tab ---

interface AccountsSettings {
  defaultPostingAccount: string;
  autoSyncAccountData: boolean;
  syncFrequency: string;
}

const accountsDefaults: AccountsSettings = {
  defaultPostingAccount: 'none',
  autoSyncAccountData: true,
  syncFrequency: 'daily',
};

function AccountsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<AccountsSettings>({
      module: 'social',
      key: 'accounts.preferences',
      defaults: accountsDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Posting Account</Label>
        <p className="text-xs text-muted-foreground">
          The account used by default when composing new posts.
        </p>
        <Select
          value={settings.defaultPostingAccount}
          onValueChange={(v) => updateField('defaultPostingAccount', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None configured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-Sync Account Data</Label>
          <p className="text-xs text-muted-foreground">
            Automatically sync follower counts, metrics, and profile data.
          </p>
        </div>
        <Switch
          checked={settings.autoSyncAccountData}
          onCheckedChange={(v) => updateField('autoSyncAccountData', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Sync Frequency</Label>
        <p className="text-xs text-muted-foreground">
          How often account data is synchronized.
        </p>
        <Select
          value={settings.syncFrequency}
          onValueChange={(v) => updateField('syncFrequency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hourly">Every hour</SelectItem>
            <SelectItem value="6h">Every 6 hours</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Posting Tab ---

interface PostingSettings {
  defaultPostTime: string;
  requireApproval: boolean;
  autoGenerateHashtags: boolean;
  enableLinkShortening: boolean;
}

const postingDefaults: PostingSettings = {
  defaultPostTime: '09:00',
  requireApproval: false,
  autoGenerateHashtags: true,
  enableLinkShortening: true,
};

function PostingTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<PostingSettings>({
      module: 'social',
      key: 'posting.preferences',
      defaults: postingDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Post Time</Label>
        <p className="text-xs text-muted-foreground">
          The default time used when scheduling posts.
        </p>
        <Input
          type="time"
          value={settings.defaultPostTime}
          onChange={(e) => updateField('defaultPostTime', e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Require Approval Before Posting</Label>
          <p className="text-xs text-muted-foreground">
            Posts must be approved before being published to social accounts.
          </p>
        </div>
        <Switch
          checked={settings.requireApproval}
          onCheckedChange={(v) => updateField('requireApproval', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-Generate Hashtags</Label>
          <p className="text-xs text-muted-foreground">
            Suggest relevant hashtags based on post content.
          </p>
        </div>
        <Switch
          checked={settings.autoGenerateHashtags}
          onCheckedChange={(v) => updateField('autoGenerateHashtags', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Link Shortening</Label>
          <p className="text-xs text-muted-foreground">
            Automatically shorten URLs included in posts.
          </p>
        </div>
        <Switch
          checked={settings.enableLinkShortening}
          onCheckedChange={(v) => updateField('enableLinkShortening', v)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Engagement Tab ---

interface EngagementSettings {
  enableAutoRespond: boolean;
  engagementAlerts: boolean;
  sentimentTracking: boolean;
  alertThreshold: string;
}

const engagementDefaults: EngagementSettings = {
  enableAutoRespond: false,
  engagementAlerts: true,
  sentimentTracking: true,
  alertThreshold: 'high',
};

function EngagementTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<EngagementSettings>({
      module: 'social',
      key: 'engagement.preferences',
      defaults: engagementDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Enable Auto-Respond</Label>
          <p className="text-xs text-muted-foreground">
            Automatically respond to common messages and mentions.
          </p>
        </div>
        <Switch
          checked={settings.enableAutoRespond}
          onCheckedChange={(v) => updateField('enableAutoRespond', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Engagement Alerts</Label>
          <p className="text-xs text-muted-foreground">
            Receive notifications for new engagement activity.
          </p>
        </div>
        <Switch
          checked={settings.engagementAlerts}
          onCheckedChange={(v) => updateField('engagementAlerts', v)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Sentiment Tracking</Label>
          <p className="text-xs text-muted-foreground">
            Analyze sentiment of mentions and comments.
          </p>
        </div>
        <Switch
          checked={settings.sentimentTracking}
          onCheckedChange={(v) => updateField('sentimentTracking', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Alert Threshold</Label>
        <p className="text-xs text-muted-foreground">
          The minimum importance level for engagement alerts.
        </p>
        <Select
          value={settings.alertThreshold}
          onValueChange={(v) => updateField('alertThreshold', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All mentions</SelectItem>
            <SelectItem value="high">High priority only</SelectItem>
            <SelectItem value="critical">Critical only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Content Tab ---

interface ContentSettings {
  aiTone: string;
  brandVoice: string;
  utmSource: string;
  utmMedium: string;
  utmCampaignPrefix: string;
  enableContentTemplates: boolean;
}

const contentDefaults: ContentSettings = {
  aiTone: 'professional',
  brandVoice: '',
  utmSource: '',
  utmMedium: 'social',
  utmCampaignPrefix: '',
  enableContentTemplates: true,
};

function ContentTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<ContentSettings>({
      module: 'social',
      key: 'content.preferences',
      defaults: contentDefaults,
    });

  if (loading)
    return (
      <div className="flex h-32 items-center justify-center">
        <CcdLoader size="md" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium">AI Tone</Label>
        <p className="text-xs text-muted-foreground">
          The default tone used when AI generates social media content.
        </p>
        <Select
          value={settings.aiTone}
          onValueChange={(v) => updateField('aiTone', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="casual">Casual</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="humorous">Humorous</SelectItem>
            <SelectItem value="authoritative">Authoritative</SelectItem>
            <SelectItem value="inspirational">Inspirational</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Brand Voice Guidelines</Label>
        <p className="text-xs text-muted-foreground">
          Describe your brand voice for consistent messaging across posts.
        </p>
        <textarea
          value={settings.brandVoice}
          onChange={(e) => updateField('brandVoice', e.target.value)}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="e.g. We use an approachable, expert tone. Avoid jargon. Always include a CTA."
        />
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <Label className="text-sm font-medium">UTM Defaults</Label>
        <p className="text-xs text-muted-foreground">
          Default UTM parameters automatically appended to links in posts.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">utm_source</Label>
            <Input
              value={settings.utmSource}
              onChange={(e) => updateField('utmSource', e.target.value)}
              placeholder="e.g. facebook"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">utm_medium</Label>
            <Input
              value={settings.utmMedium}
              onChange={(e) => updateField('utmMedium', e.target.value)}
              placeholder="social"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">utm_campaign prefix</Label>
          <Input
            value={settings.utmCampaignPrefix}
            onChange={(e) => updateField('utmCampaignPrefix', e.target.value)}
            placeholder="e.g. spring2025_"
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Content Templates</Label>
          <p className="text-xs text-muted-foreground">
            Enable reusable content templates in the compose editor.
          </p>
        </div>
        <Switch
          checked={settings.enableContentTemplates}
          onCheckedChange={(v) => updateField('enableContentTemplates', v)}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// --- Main Dialog ---

export function SocialSettingsDialog({
  open,
  onOpenChange,
}: SocialSettingsDialogProps) {
  const mod = MODULES['social'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'accounts',
      label: 'Accounts',
      icon: <Users />,
      content: <AccountsTabContent />,
    },
    {
      value: 'posting',
      label: 'Posting',
      icon: <Send />,
      content: <PostingTabContent />,
    },
    {
      value: 'engagement',
      label: 'Engagement',
      icon: <MessageCircle />,
      content: <EngagementTabContent />,
    },
    {
      value: 'content',
      label: 'Content',
      icon: <Palette />,
      content: <ContentTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'Social Media'} Settings`}
      description="Configure social accounts, posting defaults, and engagement preferences."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<Share2 />}
    />
  );
}
