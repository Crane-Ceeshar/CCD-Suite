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
  MODULE_COLORS,
  ConfirmationDialog,
  CcdLoader,
  toast,
} from '@ccd/ui';
import { ShieldCheck, Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { apiGet, apiDelete } from '@/lib/api';
import { RoleDialog } from '@/components/team/role-dialog';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

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
/*  Module color badge helper                                                  */
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
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function RolesSettingsPage() {
  const [predefinedRoles, setPredefinedRoles] = React.useState<PredefinedRole[]>([]);
  const [customRoles, setCustomRoles] = React.useState<CustomRole[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState<{
    id: string;
    name: string;
    description: string | null;
    modules: string[];
  } | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);

  /* ---------------------------------------------------------------------- */
  /*  Data loading                                                          */
  /* ---------------------------------------------------------------------- */

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await apiGet<RolesResponse>('/api/team/roles');
        if (cancelled) return;
        setPredefinedRoles(res.data.predefined);
        setCustomRoles(res.data.custom);
      } catch {
        if (!cancelled) {
          toast({
            title: 'Failed to load roles',
            description: 'Please refresh the page and try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function refresh() {
    setRefreshKey((k) => k + 1);
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
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  const allRoles = [
    ...predefinedRoles.map((r) => ({ ...r, type: 'system' as const })),
    ...customRoles.map((r) => ({ ...r, type: 'custom' as const })),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Roles
              </CardTitle>
              <CardDescription>
                Define roles to control which modules each team member can access
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setEditingRole(null);
                setRoleDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allRoles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/60 p-8 text-center">
              <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No roles defined</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create roles to control module access for your team members.
              </p>
              <Button
                size="sm"
                className="mt-4"
                onClick={() => {
                  setEditingRole(null);
                  setRoleDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create First Role
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors bg-muted/30">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Name
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                        Modules
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {allRoles.map((role) => {
                      const isSystem = role.type === 'system';
                      return (
                        <tr
                          key={role.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          {/* Name */}
                          <td className="p-4 align-middle">
                            <div>
                              <span className="font-medium text-foreground">
                                {role.name}
                              </span>
                              {role.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                  {role.description}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="p-4 align-middle">
                            {isSystem ? (
                              <Badge variant="secondary" className="text-xs">
                                System
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Custom
                              </Badge>
                            )}
                          </td>

                          {/* Modules */}
                          <td className="p-4 align-middle">
                            <div className="flex flex-wrap gap-1.5">
                              {role.modules.map((mod) => (
                                <ModuleBadge key={mod} moduleId={mod} />
                              ))}
                              {role.modules.length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                  No modules
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-4 align-middle text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled={isSystem}
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
                              {isSystem ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete role</span>
                                </Button>
                              ) : (
                                <ConfirmationDialog
                                  trigger={
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span className="sr-only">Delete role</span>
                                    </Button>
                                  }
                                  title="Delete Role"
                                  description={`Are you sure you want to delete "${role.name}"? This action cannot be undone. Members assigned to this role will need to be reassigned.`}
                                  confirmLabel="Delete"
                                  variant="destructive"
                                  onConfirm={() => handleDeleteRole(role.id, role.name)}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        onSuccess={refresh}
      />
    </div>
  );
}
