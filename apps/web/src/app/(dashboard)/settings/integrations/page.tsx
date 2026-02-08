import { Badge, Button, Input } from '@ccd/ui';
import {
  Plug,
  Search,
  Mail,
  MessageSquare,
  Zap,
  BarChart3,
  Send,
  CreditCard,
  Calculator,
  GitBranch,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Integration definitions                                                    */
/* -------------------------------------------------------------------------- */

interface Integration {
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  iconBg: string;
}

const integrations: Integration[] = [
  {
    name: 'Google Workspace',
    description: 'Connect Gmail, Calendar, and Drive for seamless productivity.',
    category: 'Productivity',
    icon: <Mail className="h-5 w-5 text-white" />,
    iconBg: 'bg-red-500',
  },
  {
    name: 'Slack',
    description: 'Get real-time notifications and updates in your Slack channels.',
    category: 'Communication',
    icon: <MessageSquare className="h-5 w-5 text-white" />,
    iconBg: 'bg-purple-500',
  },
  {
    name: 'Zapier',
    description: 'Automate workflows by connecting to thousands of apps.',
    category: 'Productivity',
    icon: <Zap className="h-5 w-5 text-white" />,
    iconBg: 'bg-orange-500',
  },
  {
    name: 'HubSpot',
    description: 'Sync contacts, deals, and marketing data with HubSpot.',
    category: 'Marketing',
    icon: <BarChart3 className="h-5 w-5 text-white" />,
    iconBg: 'bg-orange-600',
  },
  {
    name: 'Mailchimp',
    description: 'Manage email campaigns and sync subscriber lists.',
    category: 'Marketing',
    icon: <Send className="h-5 w-5 text-white" />,
    iconBg: 'bg-yellow-500',
  },
  {
    name: 'Stripe',
    description: 'Process payments and manage subscriptions seamlessly.',
    category: 'Finance',
    icon: <CreditCard className="h-5 w-5 text-white" />,
    iconBg: 'bg-indigo-500',
  },
  {
    name: 'QuickBooks',
    description: 'Sync invoices, expenses, and financial data automatically.',
    category: 'Finance',
    icon: <Calculator className="h-5 w-5 text-white" />,
    iconBg: 'bg-green-600',
  },
  {
    name: 'GitHub',
    description: 'Link repositories, track issues, and manage deployments.',
    category: 'Development',
    icon: <GitBranch className="h-5 w-5 text-white" />,
    iconBg: 'bg-gray-800',
  },
];

/* -------------------------------------------------------------------------- */
/*  Page Component                                                             */
/* -------------------------------------------------------------------------- */

export default function IntegrationsSettingsPage() {
  return (
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

      {/* Search (cosmetic) */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search integrations..."
          className="pl-9"
          readOnly
        />
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
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
              <Badge variant="outline" className="text-xs">
                Not Connected
              </Badge>
              <Button variant="outline" size="sm" disabled>
                Connect
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
