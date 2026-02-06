'use client';

import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Button } from '@ccd/ui';
import {
  MessageCircle,
  Sparkles,
  Lightbulb,
  Zap,
  PenTool,
  BrainCircuit,
  Bot,
  Settings2,
} from 'lucide-react';
import Link from 'next/link';

const MODULE_COLOR = '#10B981';

const quickLinks = [
  {
    title: 'AI Assistant',
    description: 'Start a conversation with the AI assistant for help across all modules.',
    href: '/ai/assistant',
    icon: Bot,
  },
  {
    title: 'Content Generator',
    description: 'Generate blog posts, social captions, ad copy, emails, and more.',
    href: '/ai/content-generator',
    icon: PenTool,
  },
  {
    title: 'Smart Insights',
    description: 'AI-generated insights from your CRM, finance, SEO, and social data.',
    href: '/ai/insights',
    icon: Lightbulb,
  },
  {
    title: 'Automations',
    description: 'Configure AI-powered automations for expense categorisation, deal scoring, and more.',
    href: '/ai/automations',
    icon: Settings2,
  },
];

export default function AIDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Assistant"
        description="AI-powered insights, content generation, and smart automations"
        actions={
          <Link href="/ai/assistant">
            <Button>
              <MessageCircle className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Conversations"
          value="0"
          trend="neutral"
          icon={<MessageCircle className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Content Generated"
          value="0"
          trend="neutral"
          icon={<PenTool className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Insights"
          value="0"
          trend="neutral"
          icon={<Lightbulb className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Automations Active"
          value="0"
          trend="neutral"
          icon={<Zap className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${MODULE_COLOR}15` }}
                  >
                    <link.icon className="h-5 w-5" style={{ color: MODULE_COLOR }} />
                  </div>
                  <CardTitle className="text-base">{link.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" style={{ color: MODULE_COLOR }} />
            Getting Started
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Welcome to CCD AI</p>
            <p className="text-sm max-w-md mx-auto">
              Your AI-powered assistant is ready to help with content creation, data analysis,
              smart insights, and workflow automations across all your modules.
            </p>
            <div className="mt-4">
              <Link href="/ai/assistant">
                <Button variant="outline">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Start Your First Chat
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
