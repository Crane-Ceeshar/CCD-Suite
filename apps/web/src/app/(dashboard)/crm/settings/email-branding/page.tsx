'use client';

import * as React from 'react';
import { Button, Input, Label, Switch, Textarea, toast } from '@ccd/ui';
import { Loader2, Save, Palette } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface BrandingSettings {
  companyLogoUrl: string;
  primaryBrandColor: string;
  footerText: string;
  includeUnsubscribeLink: boolean;
}

const defaultSettings: BrandingSettings = {
  companyLogoUrl: '',
  primaryBrandColor: '#4f46e5',
  footerText: '',
  includeUnsubscribeLink: true,
};

export default function EmailBrandingPage() {
  const [settings, setSettings] = React.useState<BrandingSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: BrandingSettings } | null>(
      '/api/settings/module?module=crm&key=emails.branding'
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
      await apiPatch('/api/settings/module', {
        module: 'crm',
        key: 'emails.branding',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Email branding updated successfully.' });
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
          <Palette className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Email Branding</h1>
          <p className="text-sm text-muted-foreground">
            Customize the look and feel of emails sent from the CRM.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
          {/* Company Logo URL */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Company Logo URL</Label>
            <p className="text-xs text-muted-foreground">
              URL of your company logo to display in email headers.
            </p>
            <Input
              value={settings.companyLogoUrl}
              onChange={(e) =>
                setSettings((s) => ({ ...s, companyLogoUrl: e.target.value }))
              }
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
                onChange={(e) =>
                  setSettings((s) => ({ ...s, primaryBrandColor: e.target.value }))
                }
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
              />
              <Input
                value={settings.primaryBrandColor}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, primaryBrandColor: e.target.value }))
                }
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
              onChange={(e) =>
                setSettings((s) => ({ ...s, footerText: e.target.value }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, includeUnsubscribeLink: v }))
              }
            />
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
