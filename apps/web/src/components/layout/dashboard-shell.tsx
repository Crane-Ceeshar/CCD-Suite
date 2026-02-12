'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserAvatar,
  Button,
  SearchInput,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ccd/ui';
import {
  LogOut, Settings, Bell, HelpCircle, UserPlus, Clock, Zap, Menu, Search, X,
  Sparkles, MessageCircle, PenTool, Lightbulb, BotMessageSquare, BookOpen, LayoutDashboard, Database,
} from 'lucide-react';
import { getModulesForUserType } from '@ccd/shared';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { InviteMembersDialog } from '@/components/team/invite-members-dialog';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { AnnouncementBanner } from '@/components/ui/announcement-banner';
import type { PlanTier, ModuleId } from '@ccd/shared';

interface DashboardShellProps {
  user: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string | null;
    user_type: string;
    tenant_id?: string;
    is_active?: boolean;
    metadata?: Record<string, unknown>;
    role_title?: string;
    created_at?: string;
    updated_at?: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan?: string;
    logo_url?: string | null;
    max_users?: number;
    is_active?: boolean;
    trial_ends_at?: string | null;
    settings?: {
      modules_enabled?: string[];
      features?: Record<string, boolean>;
      brand_color?: string;
      custom_domain?: string;
    };
    created_at?: string;
    updated_at?: string;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, tenant, children }: DashboardShellProps) {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchExpanded, setSearchExpanded] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const canInvite = ['admin', 'owner'].includes(user.user_type);
  const hasAiAccess = getModulesForUserType(user.user_type).includes('ai');
  const { toggleMobileMenu } = useUIStore();

  // Hydrate the Zustand auth store so client components (profile, billing, etc.) have access
  const setAuthUser = useAuthStore((s) => s.setUser);
  const setAuthSession = useAuthStore((s) => s.setSession);
  const setAuthLoading = useAuthStore((s) => s.setLoading);
  const setAllowedModules = useAuthStore((s) => s.setAllowedModules);

  React.useEffect(() => {
    const mappedUser = {
      id: user.id,
      tenant_id: user.tenant_id || tenant.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      user_type: user.user_type,
      is_active: user.is_active ?? true,
      metadata: user.metadata ?? {},
      created_at: user.created_at ?? '',
      updated_at: user.updated_at ?? '',
    };

    const mappedTenant = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: (tenant.plan ?? 'starter') as PlanTier,
      logo_url: tenant.logo_url ?? null,
      settings: {
        modules_enabled: (tenant.settings?.modules_enabled ?? []) as ModuleId[],
        features: tenant.settings?.features ?? {},
        brand_color: tenant.settings?.brand_color,
        custom_domain: tenant.settings?.custom_domain,
      },
      max_users: tenant.max_users ?? 5,
      is_active: tenant.is_active ?? true,
      trial_ends_at: tenant.trial_ends_at ?? null,
      created_at: tenant.created_at ?? '',
      updated_at: tenant.updated_at ?? '',
    };

    const session = {
      access_token: '',
      refresh_token: '',
      user: mappedUser,
      tenant: mappedTenant,
      modules: (tenant.settings?.modules_enabled ?? []) as ModuleId[],
      expires_at: 0,
    };

    setAuthUser(mappedUser);
    setAuthSession(session);
    setAllowedModules((tenant.settings?.modules_enabled ?? []) as ModuleId[]);
    setAuthLoading(false);
  }, [user, tenant, setAuthUser, setAuthSession, setAuthLoading, setAllowedModules]);

  // Trial banner calculation
  const trialDaysRemaining = React.useMemo(() => {
    if (!tenant.trial_ends_at) return null;
    const now = new Date();
    const end = new Date(tenant.trial_ends_at);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [tenant.trial_ends_at]);

  const showTrialBanner = trialDaysRemaining !== null && trialDaysRemaining > 0;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top header bar */}
      <header className="sticky top-0 z-50 flex h-16 items-center gap-2 md:gap-4 border-b bg-gradient-to-r from-card/90 via-card/80 to-card/90 backdrop-blur-xl px-3 md:px-6 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
        {/* Mobile: hamburger menu */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={toggleMobileMenu}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Left: Logo */}
        <Link href="/dashboard" className="flex items-center shrink-0">
          <Image
            src="/logos/logo-lockup.svg"
            alt="CCD Suite"
            width={140}
            height={36}
            className="h-8 w-auto dark:hidden"
            priority
          />
          <Image
            src="/logos/logo-lockup-light.svg"
            alt="CCD Suite"
            width={140}
            height={36}
            className="h-8 w-auto hidden dark:block"
            priority
          />
        </Link>

        {/* Center: Search — desktop full bar */}
        <div className="hidden md:flex flex-1 justify-center px-4 max-w-xl mx-auto">
          <SearchInput
            placeholder="Search modules, contacts, deals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="w-full bg-muted/50 border-transparent focus-within:border-border focus-within:bg-background transition-all duration-200"
          />
        </div>

        {/* Mobile: spacer to push actions right */}
        <div className="flex-1 md:hidden" />

        {/* Right: Actions */}
        <div className="flex items-center gap-1 md:gap-1.5 shrink-0">
          {/* Mobile: search icon */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
            onClick={() => setSearchExpanded(true)}
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* AI quick-access dropdown */}
          {hasAiAccess && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 md:h-9 md:w-9 rounded-full text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-colors"
                  title="AI Assistant"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-52" align="end" sideOffset={8}>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  AI Assistant
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ai/assistant')}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  New Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ai/content-generator')}>
                  <PenTool className="mr-2 h-4 w-4" />
                  Content Generator
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ai/insights')}>
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Insights
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ai/automations')}>
                  <BotMessageSquare className="mr-2 h-4 w-4" />
                  Automations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ai/library')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Content Library
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/ai/knowledge-base')}>
                  <Database className="mr-2 h-4 w-4" />
                  Knowledge Base
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/ai')}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  AI Dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {canInvite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInviteOpen(true)}
              className="hidden md:flex items-center gap-1.5 h-8 rounded-lg text-xs font-medium border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-9 w-9 rounded-full text-muted-foreground hover:text-foreground"
            title="Help & Support"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>

          <ThemeToggle />

          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-9 md:w-9 rounded-full relative text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>

          <div className="w-px h-6 bg-border/60 mx-0.5 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 md:h-9 md:w-9 rounded-full p-0 hover:ring-2 hover:ring-primary/20 transition-all">
                <UserAvatar
                  name={user.full_name || user.email}
                  imageUrl={user.avatar_url}
                  size="sm"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" sideOffset={8}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tenant.name}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile: expanded search overlay */}
        {searchExpanded && (
          <div className="absolute inset-x-0 top-0 h-16 bg-card z-50 flex items-center px-3 gap-2 md:hidden">
            <SearchInput
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              className="flex-1 bg-muted/50 border-transparent focus-within:border-border focus-within:bg-background"
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => {
                setSearchExpanded(false);
                setSearchQuery('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </header>

      {/* Trial banner */}
      {showTrialBanner && (
        <div data-print-hide className="flex items-center justify-center gap-3 px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-amber-500/15 to-amber-500/10 border-b border-amber-500/20">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Free trial:</span>{' '}
            {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
          </p>
          <Link href="/settings/billing">
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              <Zap className="h-3 w-3" />
              Upgrade Now
            </Button>
          </Link>
        </div>
      )}

      {/* Page content — modules add their own sidebar via per-module layout.tsx */}
      <main className="flex-1 overflow-auto">
        <div className="px-3 md:px-6 pt-4">
          <AnnouncementBanner />
        </div>
        {children}
      </main>

      {/* Invite members dialog */}
      {canInvite && (
        <InviteMembersDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          tenant={tenant}
        />
      )}
    </div>
  );
}
