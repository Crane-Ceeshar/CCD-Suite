'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Building2,
  Users,
  Bell,
  Palette,
  CreditCard,
  Shield,
  Plug,
  Webhook,
  ShieldCheck,
  ScrollText,
  Columns3,
  Database,
  Paintbrush,
  Clock,
  Search,
  X,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import { usePlanGate } from '@/hooks/use-plan-gate';

/* -------------------------------------------------------------------------- */
/*  Search Index                                                               */
/* -------------------------------------------------------------------------- */

const searchIndex = [
  { label: 'Profile', keywords: ['profile', 'name', 'avatar', 'email', 'phone'], href: '/settings/profile', group: 'Account' },
  { label: 'Organization', keywords: ['organization', 'company', 'logo', 'slug'], href: '/settings/organization', group: 'Account' },
  { label: 'Team', keywords: ['team', 'members', 'invite', 'roles'], href: '/settings/team', group: 'Account' },
  { label: 'Notifications', keywords: ['notifications', 'email', 'push', 'alerts'], href: '/settings/notifications', group: 'Preferences' },
  { label: 'Appearance', keywords: ['appearance', 'theme', 'dark', 'light', 'font', 'date', 'time'], href: '/settings/appearance', group: 'Preferences' },
  { label: 'Billing', keywords: ['billing', 'plan', 'subscription', 'payment', 'upgrade'], href: '/settings/billing', group: 'Billing & Security' },
  { label: 'Security', keywords: ['security', 'password', '2fa', 'sso', 'sessions', 'api keys'], href: '/settings/security', group: 'Billing & Security' },
  { label: 'Integrations', keywords: ['integrations', 'connect', 'slack', 'google', 'zapier'], href: '/settings/integrations', group: 'Connections' },
  { label: 'Webhooks', keywords: ['webhooks', 'hooks', 'events', 'url', 'endpoint'], href: '/settings/webhooks', group: 'Connections' },
  { label: 'Roles', keywords: ['roles', 'permissions', 'access', 'admin', 'owner'], href: '/settings/roles', group: 'Administration' },
  { label: 'Audit Log', keywords: ['audit', 'log', 'activity', 'history', 'changes', 'changelog'], href: '/settings/audit-log', group: 'Administration' },
  { label: 'Custom Fields', keywords: ['custom fields', 'fields', 'metadata', 'properties'], href: '/settings/custom-fields', group: 'Administration' },
  { label: 'Data Management', keywords: ['data', 'export', 'import', 'backup', 'restore'], href: '/settings/data', group: 'Administration' },
  { label: 'Branding', keywords: ['branding', 'brand', 'logo', 'colors', 'white label', 'typography'], href: '/settings/branding', group: 'Customization' },
  { label: 'Data Retention', keywords: ['retention', 'cleanup', 'delete', 'archive', 'policy'], href: '/settings/data-retention', group: 'Customization' },
];

/* -------------------------------------------------------------------------- */
/*  Navigation Groups                                                          */
/* -------------------------------------------------------------------------- */

const settingsGroups = [
  {
    label: 'Account',
    items: [
      { href: '/settings/profile', label: 'Profile', icon: User },
      { href: '/settings/organization', label: 'Organization', icon: Building2 },
      { href: '/settings/team', label: 'Team', icon: Users },
    ],
  },
  {
    label: 'Preferences',
    items: [
      { href: '/settings/notifications', label: 'Notifications', icon: Bell },
      { href: '/settings/appearance', label: 'Appearance', icon: Palette },
    ],
  },
  {
    label: 'Billing & Security',
    items: [
      { href: '/settings/billing', label: 'Billing', icon: CreditCard },
      { href: '/settings/security', label: 'Security', icon: Shield },
    ],
  },
  {
    label: 'Connections',
    items: [
      { href: '/settings/integrations', label: 'Integrations', icon: Plug },
      { href: '/settings/webhooks', label: 'Webhooks', icon: Webhook },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/settings/roles', label: 'Roles', icon: ShieldCheck },
      { href: '/settings/audit-log', label: 'Audit Log', icon: ScrollText },
      { href: '/settings/custom-fields', label: 'Custom Fields', icon: Columns3 },
      { href: '/settings/data', label: 'Data Management', icon: Database },
    ],
  },
  {
    label: 'Customization',
    items: [
      { href: '/settings/branding', label: 'Branding', icon: Paintbrush },
      { href: '/settings/data-retention', label: 'Data Retention', icon: Clock },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Layout Component                                                           */
/* -------------------------------------------------------------------------- */

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isEnterprise } = usePlanGate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showResults, setShowResults] = React.useState(false);
  const searchRef = React.useRef<HTMLDivElement>(null);

  // Filter search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return searchIndex.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [searchQuery]);

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key to close
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowResults(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handleSearchSelect(href: string) {
    router.push(href);
    setSearchQuery('');
    setShowResults(false);
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <h1 className="text-2xl md:text-3xl font-bold font-heading text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your account and organization settings
        </p>
      </div>

      {/* Search bar — desktop only */}
      <div ref={searchRef} className="relative mb-6 hidden md:block">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setShowResults(true);
            }}
            placeholder="Search settings..."
            className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-w-sm rounded-md border bg-card shadow-lg">
            <div className="max-h-64 overflow-y-auto py-1">
              {searchResults.map((result) => (
                <button
                  key={result.href}
                  type="button"
                  onClick={() => handleSearchSelect(result.href)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
                >
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground min-w-[80px]">
                    {result.group}
                  </span>
                  <span className="font-medium text-foreground">
                    {result.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showResults && searchQuery.trim() && searchResults.length === 0 && (
          <div className="absolute z-50 mt-1 w-full max-w-sm rounded-md border bg-card shadow-lg">
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No settings found for &ldquo;{searchQuery}&rdquo;
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Sidebar navigation */}
        <nav className="w-full md:w-52 shrink-0">
          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {settingsGroups.flatMap((group) => group.items).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop: grouped sidebar */}
          <div className="hidden md:flex md:flex-col gap-1">
            {settingsGroups.map((group) => {
              const isLockedGroup =
                (group.label === 'Connections' || group.label === 'Customization') && !isEnterprise;
              return (
                <div key={group.label} className={`mb-4 ${isLockedGroup ? 'opacity-60' : ''}`}>
                  <p className="mb-1.5 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    {group.label}
                    {isLockedGroup && <Lock className="h-3 w-3" />}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                          >
                            <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                            {item.label}
                            {isLockedGroup && <Lock className="h-3 w-3 ml-auto text-muted-foreground" />}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
