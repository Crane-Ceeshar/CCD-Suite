'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Switch,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { ToggleLeft, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface FlagOverride {
  id: string;
  flag_id: string;
  tenant_id: string;
  is_enabled: boolean;
}

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  created_at: string;
  overrides: FlagOverride[];
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = React.useState<FeatureFlag[]>([]);
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [expandedFlag, setExpandedFlag] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ key: '', name: '', description: '' });

  React.useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [flagsRes, tenantsRes] = await Promise.all([
        apiGet<FeatureFlag[]>('/api/admin/feature-flags'),
        apiGet<Tenant[]>('/api/admin/tenants'),
      ]);
      setFlags(flagsRes.data);
      setTenants(tenantsRes.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await apiPost<FeatureFlag>('/api/admin/feature-flags', form);
      setFlags([res.data, ...flags]);
      setShowCreate(false);
      setForm({ key: '', name: '', description: '' });
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function toggleGlobal(flagId: string, currentEnabled: boolean) {
    try {
      await apiPatch(`/api/admin/feature-flags/${flagId}`, { is_enabled: !currentEnabled });
      setFlags(flags.map((f) => (f.id === flagId ? { ...f, is_enabled: !currentEnabled } : f)));
    } catch { /* ignore */ }
  }

  async function deleteFlag(flagId: string) {
    try {
      await apiDelete(`/api/admin/feature-flags/${flagId}`);
      setFlags(flags.filter((f) => f.id !== flagId));
    } catch { /* ignore */ }
  }

  async function setOverride(flagId: string, tenantId: string, isEnabled: boolean) {
    try {
      await apiPost(`/api/admin/feature-flags/${flagId}/overrides`, { tenant_id: tenantId, is_enabled: isEnabled });
      setFlags(flags.map((f) => {
        if (f.id !== flagId) return f;
        const existing = f.overrides.findIndex((o) => o.tenant_id === tenantId);
        const newOverrides = [...f.overrides];
        if (existing >= 0) {
          newOverrides[existing] = { ...newOverrides[existing], is_enabled: isEnabled };
        } else {
          newOverrides.push({ id: '', flag_id: flagId, tenant_id: tenantId, is_enabled: isEnabled });
        }
        return { ...f, overrides: newOverrides };
      }));
    } catch { /* ignore */ }
  }

  function autoKey(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Toggle features globally or per-tenant"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Flag
          </Button>
        }
      />

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Feature Flag</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, key: autoKey(e.target.value) })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-48"
                  placeholder="Dark Mode"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Key</label>
                <input
                  type="text"
                  required
                  value={form.key}
                  onChange={(e) => setForm({ ...form, key: e.target.value })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-48 font-mono"
                  placeholder="dark_mode"
                />
              </div>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enable dark mode toggle for users"
                />
              </div>
              <Button type="submit" disabled={creating} className="bg-red-600 hover:bg-red-700">
                {creating ? <CcdSpinner size="sm" /> : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Flags List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ToggleLeft className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">No Feature Flags</p>
            <p className="text-sm text-muted-foreground">Create feature flags to control functionality across the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => {
            const isExpanded = expandedFlag === flag.id;
            return (
              <Card key={flag.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={flag.is_enabled}
                      onCheckedChange={() => toggleGlobal(flag.id, flag.is_enabled)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{flag.name}</p>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {flag.key}
                        </Badge>
                      </div>
                      {flag.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {flag.overrides.length > 0 && (
                        <Badge variant="outline">{flag.overrides.length} override(s)</Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedFlag(isExpanded ? null : flag.id)}
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteFlag(flag.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Per-tenant overrides */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Tenant Overrides</p>
                      {tenants.map((tenant) => {
                        const override = flag.overrides.find((o) => o.tenant_id === tenant.id);
                        const effectiveValue = override ? override.is_enabled : flag.is_enabled;
                        return (
                          <div key={tenant.id} className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{tenant.name}</span>
                              {override && (
                                <Badge variant="outline" className="text-xs">
                                  overridden
                                </Badge>
                              )}
                            </div>
                            <Switch
                              checked={effectiveValue}
                              onCheckedChange={(checked) => setOverride(flag.id, tenant.id, checked)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
