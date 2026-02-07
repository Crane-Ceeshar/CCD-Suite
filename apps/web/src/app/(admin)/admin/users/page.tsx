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
} from '@ccd/ui';
import { UserPlus, Loader2, MoreHorizontal } from 'lucide-react';
import { apiGet, apiPost, apiPatch } from '@/lib/api';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  user_type: string;
  is_active: boolean;
  created_at: string;
  tenants: { name: string } | null;
}

const USER_TYPE_LABELS: Record<string, string> = {
  admin: 'Admin',
  owner: 'Owner',
  sales: 'Sales',
  marketing: 'Marketing',
  project_manager: 'Project Manager',
  finance: 'Finance',
  hr: 'HR',
  client: 'Client',
};

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showInvite, setShowInvite] = React.useState(false);
  const [inviteForm, setInviteForm] = React.useState({ email: '', full_name: '', user_type: 'sales' });
  const [inviting, setInviting] = React.useState(false);

  React.useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await apiGet<UserProfile[]>('/api/admin/users');
      setUsers(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      await apiPost('/api/admin/users/invite', inviteForm);
      setShowInvite(false);
      setInviteForm({ email: '', full_name: '', user_type: 'sales' });
      await loadUsers();
    } catch { /* ignore */ }
    setInviting(false);
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    try {
      await apiPatch(`/api/admin/users/${userId}`, { is_active: !currentActive });
      setUsers(users.map((u) => (u.id === userId ? { ...u, is_active: !currentActive } : u)));
    } catch { /* ignore */ }
  }

  async function changeRole(userId: string, newType: string) {
    try {
      await apiPatch(`/api/admin/users/${userId}`, { user_type: newType });
      setUsers(users.map((u) => (u.id === userId ? { ...u, user_type: newType } : u)));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description="Manage team members, roles, and access"
        actions={
          <Button onClick={() => setShowInvite(!showInvite)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite User
          </Button>
        }
      />

      {/* Invite Form */}
      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invite New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-60"
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                <input
                  type="text"
                  required
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-48"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Role</label>
                <select
                  value={inviteForm.user_type}
                  onChange={(e) => setInviteForm({ ...inviteForm, user_type: e.target.value })}
                  className="block rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {Object.entries(USER_TYPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={inviting} className="bg-red-600 hover:bg-red-700">
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Invite'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Name</th>
                  <th className="text-left font-medium p-3">Email</th>
                  <th className="text-left font-medium p-3">Organisation</th>
                  <th className="text-left font-medium p-3">Role</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Joined</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{user.full_name}</td>
                    <td className="p-3 text-muted-foreground">{user.email}</td>
                    <td className="p-3 text-muted-foreground">{user.tenants?.name ?? '—'}</td>
                    <td className="p-3">
                      <select
                        value={user.user_type}
                        onChange={(e) => changeRole(user.id, e.target.value)}
                        className="rounded border bg-background px-2 py-1 text-xs"
                      >
                        {Object.entries(USER_TYPE_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(user.id, user.is_active)}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
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
