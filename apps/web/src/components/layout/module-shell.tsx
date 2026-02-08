'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MODULES } from '@ccd/shared';
import type { ModuleId } from '@ccd/shared';
import { ModuleIcon, Button, ScrollArea, Sheet, SheetContent } from '@ccd/ui';
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

function SidebarContent({
  moduleId,
  navItems,
  settingsHref,
  collapsed,
  onToggle,
  onNavClick,
}: {
  moduleId: ModuleId;
  navItems: ModuleNavItem[];
  settingsHref?: string;
  collapsed: boolean;
  onToggle?: () => void;
  onNavClick?: (href: string) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const mod = MODULES[moduleId];

  if (!mod) return null;

  function handleNav(href: string) {
    router.push(href);
    onNavClick?.(href);
  }

  return (
    <>
      {/* Module header */}
      <div className="flex items-center justify-between gap-2 px-3 py-3.5 border-b border-border/50">
        {!collapsed && (
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
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <PanelLeft className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </Button>
        )}
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
                onClick={() => handleNav(navItem.href)}
                className={`group flex items-center gap-2.5 rounded-md px-2.5 py-2.5 md:py-2 text-[13px] transition-all duration-150 w-full text-left ${
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
                title={collapsed ? navItem.label : undefined}
              >
                <span
                  className="shrink-0 [&>svg]:h-4 [&>svg]:w-4 transition-colors"
                  style={isActive ? { color: mod.color } : undefined}
                >
                  {navItem.icon}
                </span>
                {!collapsed && <span>{navItem.label}</span>}
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
            onClick={() => onNavClick?.(settingsHref)}
            className={`flex items-center gap-2 px-2.5 py-2.5 md:py-2 rounded-md text-xs transition-colors ${
              pathname.startsWith(settingsHref)
                ? 'text-foreground bg-muted/60 font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      )}

      {/* Back to dashboard - bottom */}
      <div className={`px-2.5 py-2.5 ${!settingsHref ? 'border-t border-border/50' : ''} mt-auto`}>
        <Link
          href="/dashboard"
          onClick={() => onNavClick?.('/dashboard')}
          className="flex items-center gap-2 px-2.5 py-2.5 md:py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span>Back to Dashboard</span>}
        </Link>
      </div>
    </>
  );
}

export function ModuleShell({ moduleId, navItems, settingsHref, children }: ModuleShellProps) {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const mod = MODULES[moduleId];

  if (!mod) return <>{children}</>;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar — hidden on mobile */}
      <motion.aside
        initial={{ x: -10, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="hidden md:flex flex-col border-r bg-card/95 shrink-0 transition-all duration-300"
        style={{
          width: sidebarCollapsed ? '4rem' : '15.5rem',
        }}
      >
        <SidebarContent
          moduleId={moduleId}
          navItems={navItems}
          settingsHref={settingsHref}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />
      </motion.aside>

      {/* Mobile sidebar — Sheet overlay */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0 md:hidden">
          <div className="flex flex-col h-full">
            <SidebarContent
              moduleId={moduleId}
              navItems={navItems}
              settingsHref={settingsHref}
              collapsed={false}
              onNavClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Module content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {children}
      </div>
    </div>
  );
}
