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
import { Save, Search, Globe, ClipboardCheck } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

interface SeoSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Crawl Tab ---

interface CrawlSettings {
  crawlFrequency: string;
  respectRobotsTxt: boolean;
  maxPagesPerCrawl: string;
  customUserAgent: string;
}

const crawlDefaults: CrawlSettings = {
  crawlFrequency: 'weekly',
  respectRobotsTxt: true,
  maxPagesPerCrawl: '500',
  customUserAgent: 'CCD-Bot/1.0',
};

function CrawlTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<CrawlSettings>({
      module: 'seo',
      key: 'crawl.preferences',
      defaults: crawlDefaults,
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
        <Label className="text-sm font-medium">Crawl Frequency</Label>
        <p className="text-xs text-muted-foreground">
          How often the SEO crawler scans your sites.
        </p>
        <Select
          value={settings.crawlFrequency}
          onValueChange={(v) => updateField('crawlFrequency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Respect robots.txt</Label>
          <p className="text-xs text-muted-foreground">
            Follow robots.txt rules when crawling pages.
          </p>
        </div>
        <Switch
          checked={settings.respectRobotsTxt}
          onCheckedChange={(v) => updateField('respectRobotsTxt', v)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Max Pages Per Crawl</Label>
        <p className="text-xs text-muted-foreground">
          Maximum number of pages to crawl in a single session.
        </p>
        <Input
          type="number"
          value={settings.maxPagesPerCrawl}
          onChange={(e) => updateField('maxPagesPerCrawl', e.target.value)}
          placeholder="500"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Custom User Agent</Label>
        <p className="text-xs text-muted-foreground">
          The user agent string sent by the crawler.
        </p>
        <Input
          value={settings.customUserAgent}
          onChange={(e) => updateField('customUserAgent', e.target.value)}
          placeholder="CCD-Bot/1.0"
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

// --- Keywords Tab ---

interface KeywordsSettings {
  defaultTrackingRegion: string;
  searchEngine: string;
  updateFrequency: string;
}

const keywordsDefaults: KeywordsSettings = {
  defaultTrackingRegion: 'us',
  searchEngine: 'google',
  updateFrequency: 'daily',
};

function KeywordsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<KeywordsSettings>({
      module: 'seo',
      key: 'keywords.preferences',
      defaults: keywordsDefaults,
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
        <Label className="text-sm font-medium">Default Tracking Region</Label>
        <p className="text-xs text-muted-foreground">
          The geographic region for keyword rank tracking.
        </p>
        <Select
          value={settings.defaultTrackingRegion}
          onValueChange={(v) => updateField('defaultTrackingRegion', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Search Engine</Label>
        <p className="text-xs text-muted-foreground">
          The search engine used for keyword tracking.
        </p>
        <Select
          value={settings.searchEngine}
          onValueChange={(v) => updateField('searchEngine', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google</SelectItem>
            <SelectItem value="bing">Bing</SelectItem>
            <SelectItem value="yahoo">Yahoo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Update Frequency</Label>
        <p className="text-xs text-muted-foreground">
          How often keyword rankings are refreshed.
        </p>
        <Select
          value={settings.updateFrequency}
          onValueChange={(v) => updateField('updateFrequency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
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

// --- Audits Tab ---

interface AuditsSettings {
  autoAuditSchedule: string;
  minimumSeverity: string;
  emailAuditResults: boolean;
}

const auditsDefaults: AuditsSettings = {
  autoAuditSchedule: 'monthly',
  minimumSeverity: 'warning',
  emailAuditResults: false,
};

function AuditsTabContent() {
  const { settings, updateField, loading, saving, save } =
    useModuleSettings<AuditsSettings>({
      module: 'seo',
      key: 'audits.preferences',
      defaults: auditsDefaults,
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
        <Label className="text-sm font-medium">Auto-Audit Schedule</Label>
        <p className="text-xs text-muted-foreground">
          How often automated SEO audits are run.
        </p>
        <Select
          value={settings.autoAuditSchedule}
          onValueChange={(v) => updateField('autoAuditSchedule', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="off">Off</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Minimum Severity to Report</Label>
        <p className="text-xs text-muted-foreground">
          Only report audit issues at or above this severity level.
        </p>
        <Select
          value={settings.minimumSeverity}
          onValueChange={(v) => updateField('minimumSeverity', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Email Audit Results</Label>
          <p className="text-xs text-muted-foreground">
            Send audit reports to the team via email.
          </p>
        </div>
        <Switch
          checked={settings.emailAuditResults}
          onCheckedChange={(v) => updateField('emailAuditResults', v)}
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

export function SeoSettingsDialog({
  open,
  onOpenChange,
}: SeoSettingsDialogProps) {
  const mod = MODULES['seo'];

  const tabs: ModuleSettingsTab[] = [
    {
      value: 'crawl',
      label: 'Crawl',
      icon: <Globe />,
      content: <CrawlTabContent />,
    },
    {
      value: 'keywords',
      label: 'Keywords',
      icon: <Search />,
      content: <KeywordsTabContent />,
    },
    {
      value: 'audits',
      label: 'Audits',
      icon: <ClipboardCheck />,
      content: <AuditsTabContent />,
    },
  ];

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${mod?.name || 'SEO'} Settings`}
      description="Configure crawl settings, keyword tracking, and audit preferences."
      tabs={tabs}
      moduleColor={mod?.color}
      icon={<Search />}
    />
  );
}
