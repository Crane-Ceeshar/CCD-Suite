'use client';

import * as React from 'react';
import {
  Button,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
  CcdLoader,
} from '@ccd/ui';
import { Loader2, Save, Mail } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface EmailLoggingSettings {
  enableEmailLogging: boolean;
  logSentEmails: boolean;
  logReceivedEmails: boolean;
  defaultLoggingBehavior: string;
}

const defaultSettings: EmailLoggingSettings = {
  enableEmailLogging: true,
  logSentEmails: true,
  logReceivedEmails: true,
  defaultLoggingBehavior: 'all',
};

export default function EmailLoggingPage() {
  const [settings, setSettings] = React.useState<EmailLoggingSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: EmailLoggingSettings } | null>(
      '/api/settings/module?module=crm&key=emails.logging'
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
        key: 'emails.logging',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Email logging settings updated successfully.' });
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
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Mail className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Email Logging</h1>
          <p className="text-sm text-muted-foreground">
            Control how outgoing and incoming emails are tracked in the CRM.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, enableEmailLogging: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, logSentEmails: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, logReceivedEmails: v }))
              }
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
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, defaultLoggingBehavior: v }))
              }
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
