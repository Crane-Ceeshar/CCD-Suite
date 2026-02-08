'use client';

import * as React from 'react';
import { Button, Input, Label, Switch, Textarea, toast } from '@ccd/ui';
import { Loader2, Save, FileSignature } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface SignatureSettings {
  signatureName: string;
  signatureContent: string;
  includeByDefault: boolean;
}

const defaultSettings: SignatureSettings = {
  signatureName: '',
  signatureContent: '',
  includeByDefault: true,
};

export default function EmailSignaturePage() {
  const [settings, setSettings] = React.useState<SignatureSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: SignatureSettings } | null>(
      '/api/settings/module?module=crm&key=emails.signature'
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
        key: 'emails.signature',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Email signature updated successfully.' });
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
          <FileSignature className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Email Signature</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage your email signature for CRM communications.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
          {/* Signature Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Signature Name</Label>
            <p className="text-xs text-muted-foreground">
              A label to identify this signature (e.g., &quot;Work&quot; or &quot;Personal&quot;).
            </p>
            <Input
              value={settings.signatureName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, signatureName: e.target.value }))
              }
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
              onChange={(e) =>
                setSettings((s) => ({ ...s, signatureContent: e.target.value }))
              }
              placeholder="Best regards,&#10;John Doe&#10;Sales Manager&#10;john@company.com"
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, includeByDefault: v }))
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
