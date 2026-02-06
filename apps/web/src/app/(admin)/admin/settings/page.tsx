'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@ccd/ui';
import { Save, Loader2 } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';
import { MODULES } from '@ccd/shared';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  logo_url: string | null;
  settings: { modules_enabled?: string[]; [key: string]: unknown };
}

const ALL_MODULES = Object.values(MODULES).filter((m) => m.id !== 'admin');

export default function AdminSettingsPage() {
  const [tenant, setTenant] = React.useState<Tenant | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState('');
  const [logoUrl, setLogoUrl] = React.useState('');
  const [enabledModules, setEnabledModules] = React.useState<string[]>([]);

  React.useEffect(() => {
    apiGet<Tenant>('/api/admin/settings/tenant')
      .then((res) => {
        setTenant(res.data);
        setName(res.data.name);
        setLogoUrl(res.data.logo_url ?? '');
        setEnabledModules(res.data.settings?.modules_enabled ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiPatch<Tenant>('/api/admin/settings/tenant', {
        name,
        logo_url: logoUrl || null,
        settings: { ...tenant?.settings, modules_enabled: enabledModules },
      });
      setTenant(res.data);
    } catch { /* ignore */ }
    setSaving(false);
  }

  function toggleModule(moduleId: string) {
    setEnabledModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisation Settings"
        description="Configure your tenant, modules, and features"
        actions={
          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        }
      />

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Organisation Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Logo URL</label>
              <input
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Plan</label>
            <p className="text-sm text-muted-foreground capitalize">{tenant?.plan ?? 'starter'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enabled Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {ALL_MODULES.map((mod) => (
              <label
                key={mod.id}
                className="flex items-center gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={enabledModules.includes(mod.id)}
                  onChange={() => toggleModule(mod.id)}
                  className="h-4 w-4 rounded border-input accent-red-600"
                />
                <div>
                  <span className="text-sm font-medium">{mod.name}</span>
                  <p className="text-xs text-muted-foreground">{mod.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
