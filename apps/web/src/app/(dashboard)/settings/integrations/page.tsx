'use client';

import * as React from 'react';
import { Badge, Button, Input, toast } from '@ccd/ui';
import { EnterpriseGate } from '@/components/settings/enterprise-gate';
import {
  Plug,
  Search,
  Mail,
  MessageSquare,
  Zap,
  BarChart3,
  Send,
  Calculator,
  CheckCircle2,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Integration definitions                                                    */
/* -------------------------------------------------------------------------- */

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Connect Gmail, Calendar, and Drive for seamless productivity.',
    category: 'Productivity',
    icon: <Mail className="h-5 w-5 text-white" />,
    iconBg: 'bg-red-500',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get real-time notifications and updates in your Slack channels.',
    category: 'Communication',
    icon: <MessageSquare className="h-5 w-5 text-white" />,
    iconBg: 'bg-purple-500',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows by connecting to thousands of apps.',
    category: 'Productivity',
    icon: <Zap className="h-5 w-5 text-white" />,
    iconBg: 'bg-orange-500',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts, deals, and marketing data with HubSpot.',
    category: 'Marketing',
    icon: <BarChart3 className="h-5 w-5 text-white" />,
    iconBg: 'bg-orange-600',
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'Manage email campaigns and sync subscriber lists.',
    category: 'Marketing',
    icon: <Send className="h-5 w-5 text-white" />,
    iconBg: 'bg-yellow-500',
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Sync invoices, expenses, and financial data automatically.',
    category: 'Finance',
    icon: <Calculator className="h-5 w-5 text-white" />,
    iconBg: 'bg-green-600',
  },
];

/* -------------------------------------------------------------------------- */
/*  Connection state (localStorage-backed)                                     */
/* -------------------------------------------------------------------------- */

const STORAGE_KEY = 'ccd-integrations-connected';

function getConnectedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch { /* ignore */ }
  return new Set();
}

function persistConnectedIds(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function IntegrationsSettingsPage() {
  const [search, setSearch] = React.useState('');
  const [connectedIds, setConnectedIds] = React.useState<Set<string>>(new Set());
  const [connecting, setConnecting] = React.useState<string | null>(null);

  // Load connected state from localStorage on mount
  React.useEffect(() => {
    setConnectedIds(getConnectedIds());
  }, []);

  const filtered = React.useMemo(() => {
    if (!search.trim()) return INTEGRATIONS;
    const q = search.toLowerCase();
    return INTEGRATIONS.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }, [search]);

  async function handleConnect(id: string) {
    setConnecting(id);
    // Simulate OAuth connection flow (1s delay)
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const next = new Set(connectedIds);
    next.add(id);
    setConnectedIds(next);
    persistConnectedIds(next);
    setConnecting(null);
    const integration = INTEGRATIONS.find((i) => i.id === id);
    toast({
      title: 'Connected',
      description: `${integration?.name ?? 'Integration'} has been connected successfully.`,
    });
  }

  function handleDisconnect(id: string) {
    const next = new Set(connectedIds);
    next.delete(id);
    setConnectedIds(next);
    persistConnectedIds(next);
    const integration = INTEGRATIONS.find((i) => i.id === id);
    toast({
      title: 'Disconnected',
      description: `${integration?.name ?? 'Integration'} has been disconnected.`,
    });
  }

  return (
    <EnterpriseGate feature="Third-party integrations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Integrations</h2>
              <p className="text-sm text-muted-foreground">
                Connect your favorite tools and services to streamline your workflow
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Integration Cards Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              No integrations match &ldquo;{search}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((integration) => {
              const isConnected = connectedIds.has(integration.id);
              const isConnecting = connecting === integration.id;

              return (
                <div
                  key={integration.id}
                  className="rounded-xl border bg-card p-5 space-y-4"
                >
                  {/* Icon + Name */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${integration.iconBg}`}
                    >
                      {integration.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{integration.name}</p>
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        {integration.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {integration.description}
                  </p>

                  {/* Status + Action */}
                  <div className="flex items-center justify-between pt-1">
                    {isConnected ? (
                      <>
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                        >
                          Disconnect
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="text-xs">
                          Not Connected
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isConnecting}
                          onClick={() => handleConnect(integration.id)}
                        >
                          {isConnecting ? 'Connecting...' : 'Connect'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EnterpriseGate>
  );
}
