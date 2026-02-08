'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Separator,
  CcdSpinner,
  ModuleSettingsDialog,
} from '@ccd/ui';
import type { ModuleSettingsTab } from '@ccd/ui';
import { MODULES } from '@ccd/shared';
import { Save, UserCog, Mail, GitBranch, Database } from 'lucide-react';
import { useModuleSettings } from '@/hooks/use-module-settings';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Asia/Shanghai', label: 'China (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (\u20AC)' },
  { value: 'GBP', label: 'GBP (\u00A3)' },
  { value: 'JPY', label: 'JPY (\u00A5)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'CHF', label: 'CHF (Fr)' },
  { value: 'CNY', label: 'CNY (\u00A5)' },
];

// ---------------------------------------------------------------------------
// Types & defaults
// ---------------------------------------------------------------------------

interface AccountSettings {
  defaultTimezone: string;
  defaultCurrency: string;
  privacyMode: boolean;
  autoLogActivities: boolean;
}

const accountDefaults: AccountSettings = {
  defaultTimezone: 'UTC',
  defaultCurrency: 'USD',
  privacyMode: false,
  autoLogActivities: true,
};

interface EmailLoggingSettings {
  enableEmailLogging: boolean;
  logSentEmails: boolean;
  logReceivedEmails: boolean;
  defaultLoggingBehavior: string;
}

const emailLoggingDefaults: EmailLoggingSettings = {
  enableEmailLogging: true,
  logSentEmails: true,
  logReceivedEmails: true,
  defaultLoggingBehavior: 'all',
};

interface SignatureSettings {
  signatureName: string;
  signatureContent: string;
  includeByDefault: boolean;
}

const signatureDefaults: SignatureSettings = {
  signatureName: '',
  signatureContent: '',
  includeByDefault: true,
};

interface BrandingSettings {
  companyLogoUrl: string;
  primaryBrandColor: string;
  footerText: string;
  includeUnsubscribeLink: boolean;
}

const brandingDefaults: BrandingSettings = {
  companyLogoUrl: '',
  primaryBrandColor: '#4f46e5',
  footerText: '',
  includeUnsubscribeLink: true,
};

interface NeverLogSettings {
  domains: string;
}

const neverLogDefaults: NeverLogSettings = {
  domains: '',
};

interface PipelineSettings {
  defaultPipelineName: string;
  defaultDealCurrency: string;
  autoCreateActivities: boolean;
  winProbabilityTracking: boolean;
  rottingDealThreshold: number;
}

const pipelineDefaults: PipelineSettings = {
  defaultPipelineName: 'Sales Pipeline',
  defaultDealCurrency: 'USD',
  autoCreateActivities: true,
  winProbabilityTracking: true,
  rottingDealThreshold: 30,
};

interface EnrichmentSettings {
  enableAutoEnrichment: boolean;
  enrichContacts: boolean;
  enrichCompanies: boolean;
  sources: {
    linkedin: boolean;
    google: boolean;
    publicRecords: boolean;
  };
}

const enrichmentDefaults: EnrichmentSettings = {
  enableAutoEnrichment: false,
  enrichContacts: true,
  enrichCompanies: true,
  sources: {
    linkedin: true,
    google: true,
    publicRecords: false,
  },
};

interface AssociationSettings {
  autoAssociateContactsToCompanies: boolean;
  autoAssociateDealsToContacts: boolean;
  autoAssociateActivitiesToDeals: boolean;
  matchingMethod: string;
}

const associationDefaults: AssociationSettings = {
  autoAssociateContactsToCompanies: true,
  autoAssociateDealsToContacts: true,
  autoAssociateActivitiesToDeals: true,
  matchingMethod: 'both',
};

// ---------------------------------------------------------------------------
// Shared save button
// ---------------------------------------------------------------------------

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="mt-6 flex justify-end">
      <Button onClick={onClick} disabled={saving}>
        {saving ? (
          <CcdSpinner size="sm" className="mr-2" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Changes
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 1 — Account
// ---------------------------------------------------------------------------

function AccountTab() {
  const { settings, updateField, saving, save } = useModuleSettings<AccountSettings>({
    module: 'crm',
    key: 'account.setup',
    defaults: accountDefaults,
  });

  return (
    <div className="space-y-5">
      {/* Default Timezone */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Timezone</Label>
        <p className="text-xs text-muted-foreground">
          Used for scheduling activities and displaying timestamps.
        </p>
        <Select
          value={settings.defaultTimezone}
          onValueChange={(v) => updateField('defaultTimezone', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezones.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Default Currency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Currency</Label>
        <p className="text-xs text-muted-foreground">
          Currency used for deal values and financial reporting.
        </p>
        <Select
          value={settings.defaultCurrency}
          onValueChange={(v) => updateField('defaultCurrency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Privacy Mode */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Privacy Mode</Label>
          <p className="text-xs text-muted-foreground">
            Hide sensitive deal values from non-admin users.
          </p>
        </div>
        <Switch
          checked={settings.privacyMode}
          onCheckedChange={(v) => updateField('privacyMode', v)}
        />
      </div>

      {/* Auto-log Activities */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-log Activities</Label>
          <p className="text-xs text-muted-foreground">
            Automatically log emails, calls, and meetings as activities.
          </p>
        </div>
        <Switch
          checked={settings.autoLogActivities}
          onCheckedChange={(v) => updateField('autoLogActivities', v)}
        />
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 2 — Emails (4 sections)
// ---------------------------------------------------------------------------

function EmailLoggingSection() {
  const { settings, updateField, saving, save } = useModuleSettings<EmailLoggingSettings>({
    module: 'crm',
    key: 'emails.logging',
    defaults: emailLoggingDefaults,
  });

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">Email Logging</h3>
      <div className="space-y-5">
        {/* Enable Email Logging */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enable Email Logging</Label>
            <p className="text-xs text-muted-foreground">
              Master toggle for all email logging features.
            </p>
          </div>
          <Switch
            checked={settings.enableEmailLogging}
            onCheckedChange={(v) => updateField('enableEmailLogging', v)}
          />
        </div>

        {/* Log Sent Emails */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Log Sent Emails</Label>
            <p className="text-xs text-muted-foreground">
              Automatically log emails you send to CRM contacts.
            </p>
          </div>
          <Switch
            checked={settings.logSentEmails}
            disabled={!settings.enableEmailLogging}
            onCheckedChange={(v) => updateField('logSentEmails', v)}
          />
        </div>

        {/* Log Received Emails */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Log Received Emails</Label>
            <p className="text-xs text-muted-foreground">
              Automatically log emails received from CRM contacts.
            </p>
          </div>
          <Switch
            checked={settings.logReceivedEmails}
            disabled={!settings.enableEmailLogging}
            onCheckedChange={(v) => updateField('logReceivedEmails', v)}
          />
        </div>

        {/* Default Logging Behavior */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Default Logging Behavior</Label>
          <p className="text-xs text-muted-foreground">
            Choose which contacts have their emails logged by default.
          </p>
          <Select
            value={settings.defaultLoggingBehavior}
            disabled={!settings.enableEmailLogging}
            onValueChange={(v) => updateField('defaultLoggingBehavior', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select behavior" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All contacts</SelectItem>
              <SelectItem value="selected">Selected contacts only</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>
    </>
  );
}

function EmailSignatureSection() {
  const { settings, updateField, saving, save } = useModuleSettings<SignatureSettings>({
    module: 'crm',
    key: 'emails.signature',
    defaults: signatureDefaults,
  });

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">Email Signature</h3>
      <div className="space-y-5">
        {/* Signature Name */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Signature Name</Label>
          <p className="text-xs text-muted-foreground">
            A label to identify this signature (e.g., &quot;Work&quot; or &quot;Personal&quot;).
          </p>
          <Input
            value={settings.signatureName}
            onChange={(e) => updateField('signatureName', e.target.value)}
            placeholder="My Signature"
          />
        </div>

        {/* Signature Content */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Signature Content</Label>
          <p className="text-xs text-muted-foreground">
            Compose your email signature. HTML is supported for formatting.
          </p>
          <Textarea
            value={settings.signatureContent}
            onChange={(e) => updateField('signatureContent', e.target.value)}
            placeholder={'Best regards,\nJohn Doe\nSales Manager\njohn@company.com'}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        {/* Include By Default */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Include Signature by Default</Label>
            <p className="text-xs text-muted-foreground">
              Automatically append this signature to all outgoing CRM emails.
            </p>
          </div>
          <Switch
            checked={settings.includeByDefault}
            onCheckedChange={(v) => updateField('includeByDefault', v)}
          />
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>
    </>
  );
}

function EmailBrandingSection() {
  const { settings, updateField, saving, save } = useModuleSettings<BrandingSettings>({
    module: 'crm',
    key: 'emails.branding',
    defaults: brandingDefaults,
  });

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">Email Branding</h3>
      <div className="space-y-5">
        {/* Company Logo URL */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Company Logo URL</Label>
          <p className="text-xs text-muted-foreground">
            URL of your company logo to display in email headers.
          </p>
          <Input
            value={settings.companyLogoUrl}
            onChange={(e) => updateField('companyLogoUrl', e.target.value)}
            placeholder="https://example.com/logo.png"
            type="url"
          />
        </div>

        {/* Primary Brand Color */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Primary Brand Color</Label>
          <p className="text-xs text-muted-foreground">
            Used for buttons, links, and accents in branded emails.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.primaryBrandColor}
              onChange={(e) => updateField('primaryBrandColor', e.target.value)}
              className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
            />
            <Input
              value={settings.primaryBrandColor}
              onChange={(e) => updateField('primaryBrandColor', e.target.value)}
              placeholder="#4f46e5"
              className="w-32"
            />
          </div>
        </div>

        {/* Footer Text */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Footer Text</Label>
          <p className="text-xs text-muted-foreground">
            Custom text displayed at the bottom of every CRM email.
          </p>
          <Textarea
            value={settings.footerText}
            onChange={(e) => updateField('footerText', e.target.value)}
            placeholder="Company Inc. | 123 Main St, City, State 12345"
            className="min-h-[100px]"
          />
        </div>

        {/* Include Unsubscribe Link */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Include Unsubscribe Link</Label>
            <p className="text-xs text-muted-foreground">
              Add an unsubscribe link to the footer of marketing emails.
            </p>
          </div>
          <Switch
            checked={settings.includeUnsubscribeLink}
            onCheckedChange={(v) => updateField('includeUnsubscribeLink', v)}
          />
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>
    </>
  );
}

function NeverLogSection() {
  const { settings, updateField, saving, save } = useModuleSettings<NeverLogSettings>({
    module: 'crm',
    key: 'emails.neverlog',
    defaults: neverLogDefaults,
  });

  const domainCount = settings.domains
    .split('\n')
    .filter((d) => d.trim().length > 0).length;

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">Never Log Domains</h3>
      <div className="space-y-5">
        {/* Domain List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Blocked Domains</Label>
            <span className="text-xs text-muted-foreground">
              {domainCount} {domainCount === 1 ? 'domain' : 'domains'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter one domain per line. Emails from contacts at these domains
            will be excluded from logging.
          </p>
          <Textarea
            value={settings.domains}
            onChange={(e) => updateField('domains', e.target.value)}
            placeholder={'example.com\nspam-domain.net\nnoreply.org'}
            className="min-h-[240px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Common domains to exclude: personal email providers, internal
            company domains, or known spam sources.
          </p>
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>
    </>
  );
}

function EmailsTab() {
  return (
    <div>
      <EmailLoggingSection />
      <Separator className="my-6" />
      <EmailSignatureSection />
      <Separator className="my-6" />
      <EmailBrandingSection />
      <Separator className="my-6" />
      <NeverLogSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 3 — Pipeline
// ---------------------------------------------------------------------------

function PipelineTab() {
  const { settings, updateField, saving, save } = useModuleSettings<PipelineSettings>({
    module: 'crm',
    key: 'pipeline.settings',
    defaults: pipelineDefaults,
  });

  return (
    <div className="space-y-5">
      {/* Default Pipeline Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Pipeline Name</Label>
        <p className="text-xs text-muted-foreground">
          Name of the default pipeline for new deals.
        </p>
        <Input
          value={settings.defaultPipelineName}
          onChange={(e) => updateField('defaultPipelineName', e.target.value)}
          placeholder="Sales Pipeline"
        />
      </div>

      {/* Default Deal Currency */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Default Deal Currency</Label>
        <p className="text-xs text-muted-foreground">
          Currency applied to new deals by default.
        </p>
        <Select
          value={settings.defaultDealCurrency}
          onValueChange={(v) => updateField('defaultDealCurrency', v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select currency" />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Auto-create Activities */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Auto-create Activities</Label>
          <p className="text-xs text-muted-foreground">
            Automatically create follow-up activities when deals move stages.
          </p>
        </div>
        <Switch
          checked={settings.autoCreateActivities}
          onCheckedChange={(v) => updateField('autoCreateActivities', v)}
        />
      </div>

      {/* Win Probability Tracking */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Win Probability Tracking</Label>
          <p className="text-xs text-muted-foreground">
            Track and display win probability percentages per pipeline stage.
          </p>
        </div>
        <Switch
          checked={settings.winProbabilityTracking}
          onCheckedChange={(v) => updateField('winProbabilityTracking', v)}
        />
      </div>

      {/* Rotting Deal Threshold */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Rotting Deal Threshold (Days)</Label>
        <p className="text-xs text-muted-foreground">
          Number of inactive days before a deal is flagged as rotting.
        </p>
        <Input
          type="number"
          min={1}
          max={365}
          value={settings.rottingDealThreshold}
          onChange={(e) =>
            updateField('rottingDealThreshold', parseInt(e.target.value, 10) || 30)
          }
          className="w-32"
        />
      </div>

      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab 4 — Data (Enrichment + Association)
// ---------------------------------------------------------------------------

function EnrichmentSection() {
  const { settings, setSettings, saving, save } = useModuleSettings<EnrichmentSettings>({
    module: 'crm',
    key: 'data.enrichment',
    defaults: enrichmentDefaults,
  });

  // Helper to update a top-level field
  const updateField = React.useCallback(
    <K extends keyof EnrichmentSettings>(field: K, value: EnrichmentSettings[K]) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
    },
    [setSettings],
  );

  // Helper to update a nested source field
  const updateSource = React.useCallback(
    (source: keyof EnrichmentSettings['sources'], value: boolean) => {
      setSettings((prev) => ({
        ...prev,
        sources: { ...prev.sources, [source]: value },
      }));
    },
    [setSettings],
  );

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">Enrichment</h3>
      <div className="space-y-5">
        {/* Enable Auto-enrichment */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enable Auto-enrichment</Label>
            <p className="text-xs text-muted-foreground">
              Automatically fetch and suggest data enrichments for CRM records.
            </p>
          </div>
          <Switch
            checked={settings.enableAutoEnrichment}
            onCheckedChange={(v) => updateField('enableAutoEnrichment', v)}
          />
        </div>

        {/* Enrich Contacts */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enrich Contacts</Label>
            <p className="text-xs text-muted-foreground">
              Suggest additional information for contact records (job title, phone, etc.).
            </p>
          </div>
          <Switch
            checked={settings.enrichContacts}
            disabled={!settings.enableAutoEnrichment}
            onCheckedChange={(v) => updateField('enrichContacts', v)}
          />
        </div>

        {/* Enrich Companies */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Enrich Companies</Label>
            <p className="text-xs text-muted-foreground">
              Suggest additional information for company records (industry, size, etc.).
            </p>
          </div>
          <Switch
            checked={settings.enrichCompanies}
            disabled={!settings.enableAutoEnrichment}
            onCheckedChange={(v) => updateField('enrichCompanies', v)}
          />
        </div>

        {/* Data Sources */}
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Data Sources</Label>
            <p className="text-xs text-muted-foreground">
              Select which data sources to use for enrichment.
            </p>
          </div>

          <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">LinkedIn</Label>
                <p className="text-xs text-muted-foreground">
                  Professional profiles, job titles, and company data.
                </p>
              </div>
              <Switch
                checked={settings.sources.linkedin}
                disabled={!settings.enableAutoEnrichment}
                onCheckedChange={(v) => updateSource('linkedin', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Google</Label>
                <p className="text-xs text-muted-foreground">
                  Company websites, addresses, and public information.
                </p>
              </div>
              <Switch
                checked={settings.sources.google}
                disabled={!settings.enableAutoEnrichment}
                onCheckedChange={(v) => updateSource('google', v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Public Records</Label>
                <p className="text-xs text-muted-foreground">
                  Government filings, business registrations, and public data.
                </p>
              </div>
              <Switch
                checked={settings.sources.publicRecords}
                disabled={!settings.enableAutoEnrichment}
                onCheckedChange={(v) => updateSource('publicRecords', v)}
              />
            </div>
          </div>
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>
    </>
  );
}

function AssociationSection() {
  const { settings, updateField, saving, save } = useModuleSettings<AssociationSettings>({
    module: 'crm',
    key: 'data.association',
    defaults: associationDefaults,
  });

  return (
    <>
      <h3 className="text-sm font-semibold mb-4">Item Association</h3>
      <div className="space-y-5">
        {/* Auto-associate Contacts to Companies */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Auto-associate Contacts to Companies
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically link contacts to their company based on email
              domain or manual assignment.
            </p>
          </div>
          <Switch
            checked={settings.autoAssociateContactsToCompanies}
            onCheckedChange={(v) => updateField('autoAssociateContactsToCompanies', v)}
          />
        </div>

        {/* Auto-associate Deals to Contacts */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Auto-associate Deals to Contacts
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically link deals to the contact who initiated or is
              primary on the deal.
            </p>
          </div>
          <Switch
            checked={settings.autoAssociateDealsToContacts}
            onCheckedChange={(v) => updateField('autoAssociateDealsToContacts', v)}
          />
        </div>

        {/* Auto-associate Activities to Deals */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">
              Auto-associate Activities to Deals
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically link activities (emails, calls, meetings) to
              related deals.
            </p>
          </div>
          <Switch
            checked={settings.autoAssociateActivitiesToDeals}
            onCheckedChange={(v) => updateField('autoAssociateActivitiesToDeals', v)}
          />
        </div>

        {/* Association Matching Method */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Association Matching Method
          </Label>
          <p className="text-xs text-muted-foreground">
            How the system determines which records should be linked together.
          </p>
          <Select
            value={settings.matchingMethod}
            onValueChange={(v) => updateField('matchingMethod', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email_domain">Email domain</SelectItem>
              <SelectItem value="manual">Manual only</SelectItem>
              <SelectItem value="both">Both (email domain + manual)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SaveButton saving={saving} onClick={save} />
      </div>
    </>
  );
}

function DataTab() {
  return (
    <div>
      <EnrichmentSection />
      <Separator className="my-6" />
      <AssociationSection />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CRM Settings Dialog
// ---------------------------------------------------------------------------

interface CrmSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CRM_COLOR = MODULES.crm.color;

export function CrmSettingsDialog({ open, onOpenChange }: CrmSettingsDialogProps) {
  const tabs: ModuleSettingsTab[] = React.useMemo(
    () => [
      {
        value: 'account',
        label: 'Account',
        icon: <UserCog />,
        content: <AccountTab />,
      },
      {
        value: 'emails',
        label: 'Emails',
        icon: <Mail />,
        content: <EmailsTab />,
      },
      {
        value: 'pipeline',
        label: 'Pipeline',
        icon: <GitBranch />,
        content: <PipelineTab />,
      },
      {
        value: 'data',
        label: 'Data',
        icon: <Database />,
        content: <DataTab />,
      },
    ],
    [],
  );

  return (
    <ModuleSettingsDialog
      open={open}
      onOpenChange={onOpenChange}
      title="CRM Settings"
      description="Manage account preferences, email configuration, pipeline rules, and data settings."
      tabs={tabs}
      moduleColor={CRM_COLOR}
      icon={<UserCog />}
    />
  );
}
