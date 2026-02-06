'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MODULES, MODULE_LIST, getModulesForUserType } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import {
  SidebarNav,
  UserAvatar,
  ModuleIcon,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TooltipProvider,
  type NavGroup,
} from '@ccd/ui';
import { LogOut, Settings, PanelLeftClose, PanelLeft, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/ui-store';

interface DashboardShellProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    user_type: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, tenant, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const supabase = createClient();

  const allowedModules = getModulesForUserType(user.user_type);

  const moduleNavItems = allowedModules
    .map((moduleId) => {
      const mod = MODULES[moduleId];
      if (!mod) return null;
      return {
        label: mod.name,
        href: mod.basePath,
        icon: <ModuleIcon moduleId={moduleId} size="sm" />,
        active: pathname.startsWith(mod.basePath),
      };
    })
    .filter(Boolean) as NavGroup['items'];

  const navGroups: NavGroup[] = [
    {
      label: 'Modules',
      items: moduleNavItems,
    },
    {
      label: 'Settings',
      items: [
        {
          label: 'Settings',
          href: '/settings/profile',
          icon: <Settings className="h-4 w-4" />,
          active: pathname.startsWith('/settings'),
        },
      ],
    },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className="flex flex-col border-r bg-card transition-all duration-300"
          style={{
            width: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
          }}
        >
          {/* Sidebar header */}
          <div className="flex h-header items-center justify-between border-b px-4">
            {!sidebarCollapsed && (
              <span className="text-lg font-bold font-heading text-primary">
                CCD Suite
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? (
                <PanelLeft className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <SidebarNav
            groups={navGroups}
            collapsed={sidebarCollapsed}
            onNavigate={(href) => router.push(href)}
            className="flex-1"
          />

          {/* Sidebar footer - user info */}
          <div className="border-t p-4">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <UserAvatar name={user.full_name || user.email} imageUrl={user.avatar_url} size="sm" />
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user.full_name || user.email}</p>
                  <p className="truncate text-xs text-muted-foreground">{tenant.name}</p>
                </div>
              </div>
            ) : (
              <UserAvatar name={user.full_name || user.email} imageUrl={user.avatar_url} size="sm" />
            )}
          </div>
        </aside>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <header className="flex h-header items-center justify-between border-b bg-card px-6">
            <div />
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <UserAvatar name={user.full_name || user.email} imageUrl={user.avatar_url} size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
