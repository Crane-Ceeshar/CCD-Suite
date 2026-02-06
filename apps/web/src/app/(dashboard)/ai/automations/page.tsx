'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@ccd/ui';
import {
  Zap,
  Tags,
  Search,
  MessageSquare,
  Target,
  PenTool,
} from 'lucide-react';

const AUTOMATION_TEMPLATES = [
  {
    id: 'expense_categorization',
    name: 'Expense Categorisation',
    description:
      'Automatically categorise new expenses using AI based on description, vendor, and amount patterns.',
    icon: Tags,
    module: 'Finance',
  },
  {
    id: 'seo_recommendations',
    name: 'SEO Recommendations',
    description:
      'Generate weekly SEO improvement suggestions based on keyword rankings, traffic data, and competitor analysis.',
    icon: Search,
    module: 'SEO',
  },
  {
    id: 'sentiment_analysis',
    name: 'Sentiment Analysis',
    description:
      'Analyse social media comments and messages to track brand sentiment and flag negative trends.',
    icon: MessageSquare,
    module: 'Social',
  },
  {
    id: 'deal_scoring',
    name: 'Deal Scoring',
    description:
      'Score CRM deals based on engagement history, deal size, timeline, and similar deal outcomes.',
    icon: Target,
    module: 'CRM',
  },
  {
    id: 'content_suggestions',
    name: 'Content Suggestions',
    description:
      'Suggest blog topics, social media posts, and marketing campaigns based on trending topics and audience data.',
    icon: PenTool,
    module: 'Content',
  },
];

export default function AutomationsPage() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>({});

  function toggleAutomation(id: string) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Automations"
        description="Configure AI-powered automations to streamline your workflows"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Automations' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {AUTOMATION_TEMPLATES.map((automation) => {
          const isEnabled = enabled[automation.id] ?? false;
          return (
            <Card
              key={automation.id}
              className={`transition-all ${isEnabled ? 'border-emerald-300 shadow-sm' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-lg p-2"
                      style={{
                        backgroundColor: isEnabled ? '#10B98115' : '#f1f5f9',
                      }}
                    >
                      <automation.icon
                        className="h-5 w-5"
                        style={{ color: isEnabled ? '#10B981' : '#94a3b8' }}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-base">{automation.name}</CardTitle>
                      <span className="text-xs text-muted-foreground">{automation.module}</span>
                    </div>
                  </div>

                  {/* Toggle switch */}
                  <button
                    role="switch"
                    aria-checked={isEnabled}
                    onClick={() => toggleAutomation(automation.id)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      isEnabled ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        isEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{automation.description}</p>
                {isEnabled && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
                    <Zap className="h-3.5 w-3.5" />
                    Active — runs automatically
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
