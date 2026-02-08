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
  toast,
  CcdLoader,
} from '@ccd/ui';
import { Loader2, Save, UserCog } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface AccountSettings {
  defaultTimezone: string;
  defaultCurrency: string;
  privacyMode: boolean;
  autoLogActivities: boolean;
}

const defaultSettings: AccountSettings = {
  defaultTimezone: 'UTC',
  defaultCurrency: 'USD',
  privacyMode: false,
  autoLogActivities: true,
};

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

export default function AccountSetupPage() {
  const [settings, setSettings] = React.useState<AccountSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: AccountSettings } | null>(
      '/api/settings/module?module=crm&key=account.setup'
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
        key: 'account.setup',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Account setup updated successfully.' });
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
          <UserCog className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Account Setup</h1>
          <p className="text-sm text-muted-foreground">
            Configure default preferences and privacy settings for your CRM.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
          {/* Default Timezone */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default Timezone</Label>
            <p className="text-xs text-muted-foreground">
              Used for scheduling activities and displaying timestamps.
            </p>
            <Select
              value={settings.defaultTimezone}
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, defaultTimezone: v }))
              }
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
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, defaultCurrency: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, privacyMode: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, autoLogActivities: v }))
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
