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
import { Loader2, Save, GitBranch } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface PipelineSettings {
  defaultPipelineName: string;
  defaultDealCurrency: string;
  autoCreateActivities: boolean;
  winProbabilityTracking: boolean;
  rottingDealThreshold: number;
}

const defaultSettings: PipelineSettings = {
  defaultPipelineName: 'Sales Pipeline',
  defaultDealCurrency: 'USD',
  autoCreateActivities: true,
  winProbabilityTracking: true,
  rottingDealThreshold: 30,
};

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

export default function PipelineSettingsPage() {
  const [settings, setSettings] = React.useState<PipelineSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: PipelineSettings } | null>(
      '/api/settings/module?module=crm&key=pipeline.settings'
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
        key: 'pipeline.settings',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Pipeline settings updated successfully.' });
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
          <GitBranch className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Pipeline Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure deal pipeline defaults, tracking, and automation rules.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
          {/* Default Pipeline Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Default Pipeline Name</Label>
            <p className="text-xs text-muted-foreground">
              Name of the default pipeline for new deals.
            </p>
            <Input
              value={settings.defaultPipelineName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, defaultPipelineName: e.target.value }))
              }
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
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, defaultDealCurrency: v }))
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, autoCreateActivities: v }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({ ...s, winProbabilityTracking: v }))
              }
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
                setSettings((s) => ({
                  ...s,
                  rottingDealThreshold: parseInt(e.target.value, 10) || 30,
                }))
              }
              className="w-32"
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
