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
  CcdLoader,
} from '@ccd/ui';
import { Building2, Plus, Loader2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  is_active: boolean;
  max_users: number;
  trial_ends_at: string | null;
  user_count: number;
  created_at: string;
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  professional: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  enterprise: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  custom: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [createForm, setCreateForm] = React.useState({ name: '', slug: '', plan: 'starter' });
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    loadTenants();
  }, []);

  async function loadTenants() {
    setLoading(true);
    try {
      const res = await apiGet<Tenant[]>('/api/admin/tenants');
      setTenants(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiPost('/api/admin/tenants', createForm);
      setShowCreate(false);
      setCreateForm({ name: '', slug: '', plan: 'starter' });
      await loadTenants();
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function toggleActive(tenantId: string, currentActive: boolean) {
    try {
      await apiPatch(`/api/admin/tenants/${tenantId}`, { is_active: !currentActive });
      setTenants(tenants.map((t) => (t.id === tenantId ? { ...t, is_active: !currentActive } : t)));
    } catch { /* ignore */ }
  }

  async function changePlan(tenantId: string, newPlan: string) {
    try {
      await apiPatch(`/api/admin/tenants/${tenantId}`, { plan: newPlan });
      setTenants(tenants.map((t) => (t.id === tenantId ? { ...t, plan: newPlan } : t)));
    } catch { /* ignore */ }
  }

  function autoSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Management"
        description="Manage organisations, plans, and access across the platform"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Tenant
          </Button>
        }
      />

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value, slug: autoSlug(e.target.value) })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-60"
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Slug</label>
                <input
                  type="text"
                  required
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-48"
                  placeholder="acme-corp"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Plan</label>
                <select
                  value={createForm.plan}
                  onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <Button type="submit" disabled={creating} className="bg-red-600 hover:bg-red-700">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tenants Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : tenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">No Tenants</p>
            <p className="text-sm text-muted-foreground">Create your first tenant to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Name</th>
                  <th className="text-left font-medium p-3">Slug</th>
                  <th className="text-left font-medium p-3">Plan</th>
                  <th className="text-left font-medium p-3">Users</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Trial Ends</th>
                  <th className="text-left font-medium p-3">Created</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{tenant.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs">{tenant.slug}</td>
                    <td className="p-3">
                      <select
                        value={tenant.plan}
                        onChange={(e) => changePlan(tenant.id, e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        <option value="starter">Starter</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                        <option value="custom">Custom</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <span className="text-muted-foreground">{tenant.user_count}/{tenant.max_users}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant={tenant.is_active ? 'default' : 'secondary'}>
                        {tenant.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {tenant.trial_ends_at
                        ? new Date(tenant.trial_ends_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(tenant.id, tenant.is_active)}
                      >
                        {tenant.is_active ? 'Suspend' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
