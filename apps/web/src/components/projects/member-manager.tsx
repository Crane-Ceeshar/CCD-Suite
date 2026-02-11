'use client';

import * as React from 'react';
import {
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  FormField,
  CcdSpinner,
} from '@ccd/ui';
import { UserPlus, Trash2 } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface MemberProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  profile: MemberProfile | null;
}

interface TeamUser {
  id: string;
  full_name: string;
  email: string;
}

interface MemberManagerProps {
  projectId: string;
  members: Member[];
  onRefresh: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  member: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function MemberManager({ projectId, members, onRefresh }: MemberManagerProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [teamUsers, setTeamUsers] = React.useState<TeamUser[]>([]);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState('member');
  const [adding, setAdding] = React.useState(false);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');

  const memberUserIds = new Set(members.map((m) => m.user_id));

  React.useEffect(() => {
    if (addOpen) {
      apiGet<TeamUser[]>('/api/team?limit=200')
        .then((res) => setTeamUsers(res.data))
        .catch(() => {});
      setSelectedUserId('');
      setSelectedRole('member');
      setError('');
    }
  }, [addOpen]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId) {
      setError('Select a team member');
      return;
    }
    setAdding(true);
    setError('');
    try {
      await apiPost(`/api/projects/${projectId}/members`, {
        user_id: selectedUserId,
        role: selectedRole,
      });
      onRefresh();
      setAddOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member');
    } finally {
      setAdding(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: string) {
    try {
      await apiPatch(`/api/projects/${projectId}/members/${memberId}`, { role: newRole });
      onRefresh();
    } catch {
      // ignore
    }
  }

  async function handleRemove(memberId: string) {
    setRemoving(memberId);
    try {
      await apiDelete(`/api/projects/${projectId}/members/${memberId}`);
      onRefresh();
    } catch {
      // ignore
    } finally {
      setRemoving(null);
    }
  }

  const availableUsers = teamUsers.filter((u) => !memberUserIds.has(u.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Team Members</h4>
        <Button size="sm" variant="outline" onClick={() => setAddOpen(true)}>
          <UserPlus className="mr-1 h-3 w-3" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                {(member.profile?.full_name ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{member.profile?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground truncate">{member.profile?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {member.role === 'owner' ? (
                <Badge className={ROLE_COLORS.owner}>owner</Badge>
              ) : (
                <Select
                  value={member.role}
                  onValueChange={(v) => handleRoleChange(member.id, v)}
                >
                  <SelectTrigger className="h-7 w-24 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              )}
              {member.role !== 'owner' && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(member.id)}
                  disabled={removing === member.id}
                >
                  {removing === member.id ? (
                    <CcdSpinner size="sm" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Add a team member to this project</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <FormField label="Team Member" required>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 && (
                    <SelectItem value="__none" disabled>No available members</SelectItem>
                  )}
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="Role">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={adding}>
                {adding && <CcdSpinner size="sm" className="mr-2" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
