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
  CcdSpinner,
} from '@ccd/ui';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  tenant_id: string | null;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

function getStatus(a: Announcement): string {
  if (!a.is_active) return 'Disabled';
  const now = Date.now();
  const start = new Date(a.starts_at).getTime();
  const end = a.ends_at ? new Date(a.ends_at).getTime() : Infinity;
  if (now < start) return 'Scheduled';
  if (now > end) return 'Expired';
  return 'Active';
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState({
    title: '',
    message: '',
    type: 'info',
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
  });

  React.useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    setLoading(true);
    try {
      const res = await apiGet<Announcement[]>('/api/admin/announcements');
      setAnnouncements(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await apiPost('/api/admin/announcements', {
        ...form,
        ends_at: form.ends_at || null,
      });
      setShowCreate(false);
      setForm({
        title: '',
        message: '',
        type: 'info',
        starts_at: new Date().toISOString().slice(0, 16),
        ends_at: '',
      });
      await loadAnnouncements();
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await apiPatch(`/api/admin/announcements/${id}`, { is_active: !currentActive });
      setAnnouncements(announcements.map((a) => (a.id === id ? { ...a, is_active: !currentActive } : a)));
    } catch { /* ignore */ }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`/api/admin/announcements/${id}`);
      setAnnouncements(announcements.filter((a) => a.id !== id));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Announcements"
        description="Create and manage platform-wide announcements and banners"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)} className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Create Announcement
          </Button>
        }
      />

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Scheduled Maintenance"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Message</label>
                <textarea
                  required
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="We will be performing scheduled maintenance..."
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Starts At</label>
                  <input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ends At (optional)</label>
                  <input
                    type="datetime-local"
                    value={form.ends_at}
                    onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                    className="block w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <Button type="submit" disabled={creating} className="bg-red-600 hover:bg-red-700">
                {creating ? <CcdSpinner size="sm" /> : 'Create Announcement'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">No Announcements</p>
            <p className="text-sm text-muted-foreground">Create an announcement to notify users across the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Title</th>
                  <th className="text-left font-medium p-3">Type</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Starts</th>
                  <th className="text-left font-medium p-3">Ends</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => {
                  const status = getStatus(a);
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3">
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{a.message}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={TYPE_COLORS[a.type]}>
                          {a.type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={status === 'Active' ? 'default' : 'secondary'}>
                          {status}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {new Date(a.starts_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-muted-foreground whitespace-nowrap">
                        {a.ends_at ? new Date(a.ends_at).toLocaleString() : '—'}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(a.id, a.is_active)}
                          >
                            {a.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(a.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
