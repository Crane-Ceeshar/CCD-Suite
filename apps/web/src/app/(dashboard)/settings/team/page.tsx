'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  UserAvatar,
  toast,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  MODULE_COLORS,
  CcdLoader,
} from '@ccd/ui';
import {
  Users,
  UserPlus,
  Shield,
  Plus,
  Pencil,
  Trash2,
  MoreHorizontal,
  Mail,
  XCircle,
} from 'lucide-react';
import { apiGet, apiPatch, apiDelete } from '@/lib/api';
import { InviteMembersDialog } from '@/components/team/invite-members-dialog';
import { RoleDialog } from '@/components/team/role-dialog';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  user_type: string;
  role_title: string | null;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  user_type: string;
  invited_by: string;
  message: string | null;
  status: string;
  created_at: string;
  expires_at: string;
}

interface MembersResponse {
  members: Member[];
  invitations: Invitation[];
  max_users: number;
  plan: string;
  active_count: number;
  pending_count: number;
  total_used: number;
}

interface PredefinedRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  modules: string[];
  is_system: boolean;
  is_predefined: boolean;
}

interface CustomRole {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  modules: string[];
  is_system: boolean;
  tenant_id: string;
  created_at: string;
}

interface RolesResponse {
  predefined: PredefinedRole[];
  custom: CustomRole[];
}

/* -------------------------------------------------------------------------- */
/*  Role labels (for display in members table)                                */
/* -------------------------------------------------------------------------- */

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'sales', label: 'Sales' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'project_manager', label: 'Project Manager' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'HR' },
  { value: 'client', label: 'Client' },
];

function getRoleLabel(userType: string): string {
  const found = ROLE_OPTIONS.find((r) => r.value === userType);
  return found ? found.label : userType;
}

/* -------------------------------------------------------------------------- */
/*  Module color badge helper                                                 */
/* -------------------------------------------------------------------------- */

function ModuleBadge({ moduleId }: { moduleId: string }) {
  const color = MODULE_COLORS[moduleId] ?? '#6B7280';
  const label = moduleId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        backgroundColor: `${color}18`,
        color,
        border: `1px solid ${color}30`,
      }}
    >
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                            */
/* -------------------------------------------------------------------------- */

export default function TeamSettingsPage() {
  const [members, setMembers] = React.useState<Member[]>([]);
  const [invitations, setInvitations] = React.useState<Invitation[]>([]);
  const [activeCount, setActiveCount] = React.useState(0);
  const [maxUsers, setMaxUsers] = React.useState(5);
  const [plan, setPlan] = React.useState('starter');

  const [predefinedRoles, setPredefinedRoles] = React.useState<PredefinedRole[]>([]);
  const [customRoles, setCustomRoles] = React.useState<CustomRole[]>([]);

  const [loading, setLoading] = React.useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<{
    id: string;
    name: string;
    description: string | null;
    modules: string[];
  } | null>(null);

  const [refreshKey, setRefreshKey] = React.useState(0);

  // Tenant placeholder for the invite dialog
  const [tenant, setTenant] = React.useState({ id: '', name: 'Team', slug: '' });

  /* ---------------------------------------------------------------------- */
  /*  Data loading                                                          */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [membersRes, rolesRes] = await Promise.all([
          apiGet<MembersResponse>('/api/team/members'),
          apiGet<RolesResponse>('/api/team/roles'),
        ]);

        if (cancelled) return;

        setMembers(membersRes.data.members);
        setInvitations(membersRes.data.invitations);
        setActiveCount(membersRes.data.active_count);
        setMaxUsers(membersRes.data.max_users);
        setPlan(membersRes.data.plan);

        setPredefinedRoles(rolesRes.data.predefined);
        setCustomRoles(rolesRes.data.custom);
      } catch {
        toast({
          title: 'Failed to load team data',
          description: 'Please refresh the page and try again.',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Try to resolve tenant info from org settings for the invite dialog
  React.useEffect(() => {
    async function loadTenant() {
      try {
        const res = await apiGet<{ id: string; name: string; slug: string }>(
          '/api/settings/organization'
        );
        setTenant({ id: res.data.id, name: res.data.name, slug: res.data.slug });
      } catch {
        // Fallback is already set
      }
    }
    loadTenant();
  }, []);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  /* ---------------------------------------------------------------------- */
  /*  Member actions                                                        */
  /* ---------------------------------------------------------------------- */

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      await apiPatch(`/api/team/members/${memberId}`, { user_type: newRole });
      toast({ title: 'Role updated', description: `Member role changed to ${getRoleLabel(newRole)}.` });
      refresh();
    } catch (err) {
      toast({
        title: 'Failed to update role',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  async function handleToggleActive(memberId: string, currentlyActive: boolean) {
    try {
      await apiPatch(`/api/team/members/${memberId}`, { is_active: !currentlyActive });
      toast({
        title: currentlyActive ? 'Member deactivated' : 'Member activated',
        description: currentlyActive
          ? 'The member has been deactivated and can no longer access the platform.'
          : 'The member has been reactivated.',
      });
      refresh();
    } catch (err) {
      toast({
        title: 'Failed to update member',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Role actions                                                          */
  /* ---------------------------------------------------------------------- */

  async function handleDeleteRole(roleId: string, roleName: string) {
    try {
      await apiDelete(`/api/team/roles/${roleId}`);
      toast({ title: 'Role deleted', description: `${roleName} has been removed.` });
      refresh();
    } catch (err) {
      toast({
        title: 'Failed to delete role',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Invitation actions                                                    */
  /* ---------------------------------------------------------------------- */

  async function handleCancelInvitation(invitationId: string) {
    try {
      await apiDelete(`/api/team/invite/${invitationId}`);
      toast({ title: 'Invitation cancelled', description: 'The invitation has been revoked.' });
      refresh();
    } catch (err) {
      toast({
        title: 'Failed to cancel invitation',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  const pendingInvitations = invitations.filter((i) => i.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Team
          </CardTitle>
          <CardDescription>
            Manage team members, roles, and pending invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members" className="gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Members
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="invitations" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Invitations
                {pendingInvitations.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 text-[10px]">
                    {pendingInvitations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ============================================================ */}
            {/*  TAB 1: Members                                              */}
            {/* ============================================================ */}
            <TabsContent value="members" className="mt-6 space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {activeCount} / {maxUsers} members
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {plan} plan
                  </Badge>
                </div>
                <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>

              {/* Members table */}
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Member
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Email
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Role
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {members.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="h-24 text-center text-muted-foreground">
                            No team members yet. Invite someone to get started.
                          </td>
                        </tr>
                      ) : (
                        members.map((member) => (
                          <tr
                            key={member.id}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            {/* Avatar + Name */}
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-3">
                                <UserAvatar
                                  name={member.full_name || member.email}
                                  imageUrl={member.avatar_url}
                                  size="sm"
                                />
                                <span className="font-medium">
                                  {member.full_name || '(No name)'}
                                </span>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-4 align-middle text-muted-foreground">
                              {member.email}
                            </td>

                            {/* Role */}
                            <td className="p-4 align-middle">
                              <Badge variant="outline" className="capitalize">
                                {getRoleLabel(member.user_type)}
                              </Badge>
                            </td>

                            {/* Status */}
                            <td className="p-4 align-middle">
                              {member.is_active ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-500/10 text-green-700 border-green-500/20"
                                >
                                  Active
                                </Badge>
                              ) : (
                                <Badge
                                  variant="secondary"
                                  className="bg-red-500/10 text-red-700 border-red-500/20"
                                >
                                  Inactive
                                </Badge>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-4 align-middle text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Open actions</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  {/* Change role submenu-style items */}
                                  {ROLE_OPTIONS.filter((r) => r.value !== member.user_type).map(
                                    (role) => (
                                      <DropdownMenuItem
                                        key={role.value}
                                        onClick={() => handleChangeRole(member.id, role.value)}
                                      >
                                        <Shield className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                        Set as {role.label}
                                      </DropdownMenuItem>
                                    )
                                  )}
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleToggleActive(member.id, member.is_active)
                                    }
                                    className={
                                      member.is_active ? 'text-destructive focus:text-destructive' : ''
                                    }
                                  >
                                    {member.is_active ? (
                                      <>
                                        <XCircle className="mr-2 h-3.5 w-3.5" />
                                        Deactivate
                                      </>
                                    ) : (
                                      <>
                                        <Users className="mr-2 h-3.5 w-3.5" />
                                        Reactivate
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/*  TAB 2: Roles                                                */}
            {/* ============================================================ */}
            <TabsContent value="roles" className="mt-6 space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Define roles to control which modules each team member can access.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingRole(null);
                    setRoleDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Custom Role
                </Button>
              </div>

              {/* Predefined roles */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">System Roles</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {predefinedRoles.map((role) => (
                    <Card key={role.id} className="relative">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">
                            {role.name}
                          </CardTitle>
                          <Badge variant="secondary" className="text-[10px]">
                            System
                          </Badge>
                        </div>
                        {role.description && (
                          <CardDescription className="text-xs">
                            {role.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1.5">
                          {role.modules.map((mod) => (
                            <ModuleBadge key={mod} moduleId={mod} />
                          ))}
                          {role.modules.length === 0 && (
                            <span className="text-xs text-muted-foreground">No modules</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Custom roles */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">Custom Roles</h3>
                {customRoles.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                    <Shield className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No custom roles yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Create a custom role to fine-tune module access for your team.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {customRoles.map((role) => (
                      <Card key={role.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">
                              {role.name}
                            </CardTitle>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => {
                                  setEditingRole({
                                    id: role.id,
                                    name: role.name,
                                    description: role.description,
                                    modules: role.modules,
                                  });
                                  setRoleDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span className="sr-only">Edit role</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => handleDeleteRole(role.id, role.name)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete role</span>
                              </Button>
                            </div>
                          </div>
                          {role.description && (
                            <CardDescription className="text-xs">
                              {role.description}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex flex-wrap gap-1.5">
                            {role.modules.map((mod) => (
                              <ModuleBadge key={mod} moduleId={mod} />
                            ))}
                            {role.modules.length === 0 && (
                              <span className="text-xs text-muted-foreground">No modules</span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/*  TAB 3: Invitations                                          */}
            {/* ============================================================ */}
            <TabsContent value="invitations" className="mt-6 space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pendingInvitations.length === 0
                    ? 'No pending invitations.'
                    : `${pendingInvitations.length} pending invitation${pendingInvitations.length !== 1 ? 's' : ''}`}
                </p>
                <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </div>

              {/* Invitations table */}
              <div className="rounded-md border">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Email
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Role
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Sent
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {invitations.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="h-24 text-center text-muted-foreground">
                            No invitations have been sent yet.
                          </td>
                        </tr>
                      ) : (
                        invitations.map((inv) => (
                          <tr
                            key={inv.id}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            {/* Email */}
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground/50" />
                                <span className="font-medium">{inv.email}</span>
                              </div>
                            </td>

                            {/* Role */}
                            <td className="p-4 align-middle">
                              <Badge variant="outline" className="capitalize">
                                {getRoleLabel(inv.user_type)}
                              </Badge>
                            </td>

                            {/* Sent date */}
                            <td className="p-4 align-middle text-muted-foreground">
                              {new Date(inv.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>

                            {/* Status */}
                            <td className="p-4 align-middle">
                              {inv.status === 'pending' ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-amber-500/10 text-amber-700 border-amber-500/20"
                                >
                                  Pending
                                </Badge>
                              ) : inv.status === 'accepted' ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-green-500/10 text-green-700 border-green-500/20"
                                >
                                  Accepted
                                </Badge>
                              ) : inv.status === 'expired' ? (
                                <Badge
                                  variant="secondary"
                                  className="bg-red-500/10 text-red-700 border-red-500/20"
                                >
                                  Expired
                                </Badge>
                              ) : (
                                <Badge variant="secondary">{inv.status}</Badge>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-4 align-middle text-right">
                              {inv.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleCancelInvitation(inv.id)}
                                >
                                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                  Cancel
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/*  Dialogs                                                           */}
      {/* ================================================================== */}

      <InviteMembersDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        tenant={tenant}
        onSuccess={refresh}
      />

      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        onSuccess={refresh}
      />
    </div>
  );
}
