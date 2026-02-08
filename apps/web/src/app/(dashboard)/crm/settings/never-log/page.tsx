'use client';

import * as React from 'react';
import { Button, Label, Textarea, toast } from '@ccd/ui';
import { Loader2, Save, ShieldOff } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface NeverLogSettings {
  domains: string;
}

const defaultSettings: NeverLogSettings = {
  domains: '',
};

export default function NeverLogPage() {
  const [settings, setSettings] = React.useState<NeverLogSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const domainCount = settings.domains
    .split('\n')
    .filter((d) => d.trim().length > 0).length;

  React.useEffect(() => {
    apiGet<{ value: NeverLogSettings } | null>(
      '/api/settings/module?module=crm&key=emails.neverlog'
    )
      .then((res) => {
        if (res.data?.value) {
          setSettings({ ...defaultSettings, ...res.data.value });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean up domains before saving
      const cleanedDomains = settings.domains
        .split('\n')
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 0)
        .join('\n');

      await apiPatch('/api/settings/module', {
        module: 'crm',
        key: 'emails.neverlog',
        value: { domains: cleanedDomains },
      });
      setSettings({ domains: cleanedDomains });
      toast({ title: 'Settings saved', description: 'Never-log domains updated successfully.' });
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
          <ShieldOff className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Never Log Domains</h1>
          <p className="text-sm text-muted-foreground">
            Emails from these domains will never be logged in the CRM.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
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
              onChange={(e) =>
                setSettings((s) => ({ ...s, domains: e.target.value }))
              }
              placeholder={"example.com\nspam-domain.net\nnoreply.org"}
              className="min-h-[240px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Common domains to exclude: personal email providers, internal
              company domains, or known spam sources.
            </p>
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
