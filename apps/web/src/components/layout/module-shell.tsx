'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MODULES } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import { ModuleIcon, Button, ScrollArea } from '@ccd/ui';
import { ArrowLeft, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

interface ModuleNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface ModuleShellProps {
  moduleId: ModuleId;
  navItems: ModuleNavItem[];
  children: React.ReactNode;
}

export function ModuleShell({ moduleId, navItems, children }: ModuleShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const mod = MODULES[moduleId];

  if (!mod) return <>{children}</>;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Module sidebar */}
      <motion.aside
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex flex-col border-r bg-card/50 shrink-0 transition-all duration-300"
        style={{
          width: sidebarCollapsed ? '4rem' : '16rem',
        }}
      >
        {/* Module header */}
        <div className="flex items-center justify-between gap-2 px-3 py-4 border-b">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="shrink-0 rounded-lg p-1.5"
                style={{ backgroundColor: `${mod.color}15` }}
              >
                <ModuleIcon moduleId={moduleId} size="sm" />
              </div>
              <span className="text-sm font-semibold truncate" style={{ color: mod.color }}>
                {mod.name}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-7 w-7 shrink-0"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Back to dashboard */}
        <div className="px-2 py-2 border-b">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 shrink-0" />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-2">
          <nav className="flex flex-col gap-0.5">
            {navItems.map((navItem) => {
              const isActive =
                navItem.href === `/${moduleId}`
                  ? pathname === navItem.href || pathname === `/${moduleId}/`
                  : pathname.startsWith(navItem.href);

              return (
                <button
                  key={navItem.href}
                  onClick={() => router.push(navItem.href)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150 w-full text-left ${
                    isActive
                      ? 'bg-primary/10 font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                  style={isActive ? { color: mod.color } : undefined}
                  title={sidebarCollapsed ? navItem.label : undefined}
                >
                  <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4" style={isActive ? { color: mod.color } : undefined}>
                    {navItem.icon}
                  </span>
                  {!sidebarCollapsed && <span>{navItem.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>
      </motion.aside>

      {/* Module content */}
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}
