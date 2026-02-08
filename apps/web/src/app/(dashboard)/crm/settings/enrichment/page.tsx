'use client';

import * as React from 'react';
import { Button, Label, Switch, toast } from '@ccd/ui';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

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

const defaultSettings: EnrichmentSettings = {
  enableAutoEnrichment: false,
  enrichContacts: true,
  enrichCompanies: true,
  sources: {
    linkedin: true,
    google: true,
    publicRecords: false,
  },
};

export default function EnrichmentPage() {
  const [settings, setSettings] = React.useState<EnrichmentSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: EnrichmentSettings } | null>(
      '/api/settings/module?module=crm&key=data.enrichment'
    )
      .then((res) => {
        if (res.data?.value) {
          setSettings({
            ...defaultSettings,
            ...res.data.value,
            sources: { ...defaultSettings.sources, ...res.data.value.sources },
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPatch('/api/settings/module', {
        module: 'crm',
        key: 'data.enrichment',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Enrichment settings updated successfully.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Enrichment Suggestions</h1>
          <p className="text-sm text-muted-foreground">
            Automatically enrich contact and company records with external data.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, enableAutoEnrichment: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, enrichContacts: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, enrichCompanies: v }))
              }
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
                  onCheckedChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      sources: { ...s.sources, linkedin: v },
                    }))
                  }
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
                  onCheckedChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      sources: { ...s.sources, google: v },
                    }))
                  }
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
                  onCheckedChange={(v) =>
                    setSettings((s) => ({
                      ...s,
                      sources: { ...s.sources, publicRecords: v },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="mt-8 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
