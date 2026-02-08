'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MODULES } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import { ModuleIcon, Button, ScrollArea } from '@ccd/ui';
import { ArrowLeft, PanelLeftClose, PanelLeft, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

interface ModuleNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface ModuleShellProps {
  moduleId: ModuleId;
  navItems: ModuleNavItem[];
  settingsHref?: string;
  children: React.ReactNode;
}

export function ModuleShell({ moduleId, navItems, settingsHref, children }: ModuleShellProps) {
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
        className="flex flex-col border-r bg-card/95 shrink-0 transition-all duration-300"
        style={{
          width: sidebarCollapsed ? '4rem' : '15.5rem',
        }}
      >
        {/* Module header */}
        <div className="flex items-center justify-between gap-2 px-3 py-3.5 border-b border-border/50">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="shrink-0 rounded-lg p-1.5"
                style={{ backgroundColor: `${mod.color}12` }}
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
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2.5 py-3">
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
                  className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-all duration-150 w-full text-left ${
                    isActive
                      ? 'font-medium shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                  style={
                    isActive
                      ? {
                          color: mod.color,
                          backgroundColor: `${mod.color}10`,
                        }
                      : undefined
                  }
                  title={sidebarCollapsed ? navItem.label : undefined}
                >
                  <span
                    className="shrink-0 [&>svg]:h-4 [&>svg]:w-4 transition-colors"
                    style={isActive ? { color: mod.color } : undefined}
                  >
                    {navItem.icon}
                  </span>
                  {!sidebarCollapsed && <span>{navItem.label}</span>}
                </button>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Settings link */}
        {settingsHref && (
          <div className="px-2.5 py-1.5 border-t border-border/50">
            <Link
              href={settingsHref}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors ${
                pathname.startsWith(settingsHref)
                  ? 'text-foreground bg-muted/60 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title={sidebarCollapsed ? 'Settings' : undefined}
            >
              <Settings className="h-3.5 w-3.5 shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </Link>
          </div>
        )}

        {/* Back to dashboard - bottom */}
        <div className={`px-2.5 py-2.5 ${!settingsHref ? 'border-t border-border/50' : ''} mt-auto`}>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-2.5 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Back to Dashboard</span>}
          </Link>
        </div>
      </motion.aside>

      {/* Module content */}
      <div className="flex-1 overflow-auto p-6">
        {children}
      </div>
    </div>
  );
}
