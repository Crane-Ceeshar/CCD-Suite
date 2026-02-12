'use client';

import * as React from 'react';
import { PageHeader, StatCard, Card, CardContent, CardHeader, CardTitle, Button, CcdLoader } from '@ccd/ui';
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
import { useAiStats } from '@/hooks/use-ai';

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
  const { stats, isLoading } = useAiStats();

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
          value={isLoading ? '—' : String(stats?.conversations ?? 0)}
          trend="neutral"
          icon={<MessageCircle className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Content Generated"
          value={isLoading ? '—' : String(stats?.content_generated ?? 0)}
          trend="neutral"
          icon={<PenTool className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Insights"
          value={isLoading ? '—' : String(stats?.insights ?? 0)}
          trend="neutral"
          icon={<Lightbulb className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
        <StatCard
          label="Automations Active"
          value={isLoading ? '—' : String(stats?.automations_active ?? 0)}
          trend="neutral"
          icon={<Zap className="h-5 w-5 text-muted-foreground" />}
          moduleColor={MODULE_COLOR}
        />
      </div>

      {/* Token Usage */}
      {stats?.token_usage && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4" style={{ color: MODULE_COLOR }} />
              Token Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {stats.token_usage.used.toLocaleString()} / {stats.token_usage.budget.toLocaleString()} tokens
                </span>
                <span className="font-medium">
                  {Math.round((stats.token_usage.used / stats.token_usage.budget) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stats.token_usage.used / stats.token_usage.budget) * 100)}%`,
                    backgroundColor:
                      stats.token_usage.used / stats.token_usage.budget < 0.5
                        ? '#10B981'
                        : stats.token_usage.used / stats.token_usage.budget < 0.8
                          ? '#F59E0B'
                          : '#EF4444',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
            {stats?.recent_conversations?.length ? 'Recent Conversations' : 'Getting Started'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recent_conversations?.length ? (
            <div className="space-y-3">
              {stats.recent_conversations.map((conv) => (
                <Link
                  key={conv.id}
                  href="/ai/assistant"
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{conv.title ?? 'Untitled conversation'}</p>
                      {conv.module_context && (
                        <span className="text-xs text-muted-foreground capitalize">{conv.module_context}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
