'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Switch,
  toast,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { Bell, Save } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface NotificationChannel {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

interface NotificationPreferences {
  crm_updates: NotificationChannel;
  project_updates: NotificationChannel;
  content_updates: NotificationChannel;
  financial_alerts: NotificationChannel;
  billing: NotificationChannel;
  team_changes: NotificationChannel;
  security_alerts: NotificationChannel;
}

type CategoryKey = keyof NotificationPreferences;

const categories: { key: CategoryKey; label: string }[] = [
  { key: 'crm_updates', label: 'CRM updates' },
  { key: 'project_updates', label: 'Project updates' },
  { key: 'content_updates', label: 'Content updates' },
  { key: 'financial_alerts', label: 'Financial alerts' },
  { key: 'billing', label: 'Billing' },
  { key: 'team_changes', label: 'Team changes' },
  { key: 'security_alerts', label: 'Security alerts' },
];

const channels: { key: keyof NotificationChannel; label: string }[] = [
  { key: 'email', label: 'Email' },
  { key: 'push', label: 'Push' },
  { key: 'inApp', label: 'In-App' },
];

const defaultChannel: NotificationChannel = { email: true, push: true, inApp: true };

const defaultPreferences: NotificationPreferences = {
  crm_updates: { ...defaultChannel },
  project_updates: { ...defaultChannel },
  content_updates: { ...defaultChannel },
  financial_alerts: { ...defaultChannel },
  billing: { email: true, push: false, inApp: true },
  team_changes: { email: true, push: true, inApp: true },
  security_alerts: { email: true, push: true, inApp: true },
};

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function NotificationsSettingsPage() {
  const [prefs, setPrefs] = React.useState<NotificationPreferences>(defaultPreferences);
  const [initialPrefs, setInitialPrefs] = React.useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await apiGet<{ value: NotificationPreferences }>(
          '/api/settings/module?module=platform&key=notifications'
        );
        if (res.data?.value) {
          setPrefs(res.data.value);
          setInitialPrefs(res.data.value);
        }
      } catch {
        // Use defaults on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleCategory(category: CategoryKey, channel: keyof NotificationChannel) {
    setPrefs((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  }

  function toggleMasterChannel(channel: keyof NotificationChannel) {
    const allEnabled = categories.every((cat) => prefs[cat.key][channel]);
    setPrefs((prev) => {
      const updated = { ...prev };
      for (const cat of categories) {
        updated[cat.key] = { ...updated[cat.key], [channel]: !allEnabled };
      }
      return updated;
    });
  }

  function isMasterChecked(channel: keyof NotificationChannel): boolean {
    return categories.every((cat) => prefs[cat.key][channel]);
  }

  function isMasterIndeterminate(channel: keyof NotificationChannel): boolean {
    const checked = categories.filter((cat) => prefs[cat.key][channel]).length;
    return checked > 0 && checked < categories.length;
  }

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(initialPrefs);

  async function handleSave() {
    setSaving(true);
    try {
      await apiPatch('/api/settings/module', {
        module: 'platform',
        key: 'notifications',
        value: prefs,
      });
      setInitialPrefs(prefs);
      toast({
        title: 'Saved',
        description: 'Notification preferences updated successfully.',
      });
    } catch (err) {
      toast({
        title: 'Failed to save',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose how you want to be notified about activity in your workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors bg-muted/30">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[40%]">
                      Category
                    </th>
                    {channels.map((ch) => (
                      <th
                        key={ch.key}
                        className="h-12 px-4 text-center align-middle font-medium text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span>{ch.label}</span>
                          <Switch
                            checked={isMasterChecked(ch.key)}
                            onCheckedChange={() => toggleMasterChannel(ch.key)}
                            className="scale-75"
                            aria-label={`Toggle all ${ch.label}`}
                          />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {categories.map((cat) => (
                    <tr
                      key={cat.key}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle font-medium">
                        {cat.label}
                      </td>
                      {channels.map((ch) => (
                        <td key={ch.key} className="p-4 align-middle text-center">
                          <Switch
                            checked={prefs[cat.key][ch.key]}
                            onCheckedChange={() => toggleCategory(cat.key, ch.key)}
                            aria-label={`${cat.label} ${ch.label}`}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? (
            <CcdSpinner size="sm" className="mr-2" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
