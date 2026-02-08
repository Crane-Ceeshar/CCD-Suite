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
import { Loader2, Save, Link2 } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface AssociationSettings {
  autoAssociateContactsToCompanies: boolean;
  autoAssociateDealsToContacts: boolean;
  autoAssociateActivitiesToDeals: boolean;
  matchingMethod: string;
}

const defaultSettings: AssociationSettings = {
  autoAssociateContactsToCompanies: true,
  autoAssociateDealsToContacts: true,
  autoAssociateActivitiesToDeals: true,
  matchingMethod: 'both',
};

export default function AssociationPage() {
  const [settings, setSettings] = React.useState<AssociationSettings>(defaultSettings);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    apiGet<{ value: AssociationSettings } | null>(
      '/api/settings/module?module=crm&key=data.association'
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
        key: 'data.association',
        value: settings,
      });
      toast({ title: 'Settings saved', description: 'Association rules updated successfully.' });
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
          <Link2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Item Association Rules</h1>
          <p className="text-sm text-muted-foreground">
            Control how contacts, companies, deals, and activities are
            automatically linked together.
          </p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
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
              onCheckedChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  autoAssociateContactsToCompanies: v,
                }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  autoAssociateDealsToContacts: v,
                }))
              }
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
              onCheckedChange={(v) =>
                setSettings((s) => ({
                  ...s,
                  autoAssociateActivitiesToDeals: v,
                }))
              }
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
              onValueChange={(v) =>
                setSettings((s) => ({ ...s, matchingMethod: v }))
              }
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
