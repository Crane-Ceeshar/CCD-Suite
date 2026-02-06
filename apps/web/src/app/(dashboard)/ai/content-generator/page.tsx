'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
} from '@ccd/ui';
import {
  PenTool,
  Share2,
  Megaphone,
  Mail,
  Search,
  FileText,
  Sparkles,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { apiPost } from '@/lib/api';

const CONTENT_TYPES = [
  { id: 'blog_post', label: 'Blog Post', icon: PenTool, description: 'Engaging blog articles' },
  { id: 'social_caption', label: 'Social Caption', icon: Share2, description: 'Platform-optimised captions' },
  { id: 'ad_copy', label: 'Ad Copy', icon: Megaphone, description: 'Compelling ad headlines' },
  { id: 'email_draft', label: 'Email Draft', icon: Mail, description: 'Professional emails' },
  { id: 'seo_description', label: 'SEO Description', icon: Search, description: 'Meta descriptions' },
  { id: 'summary', label: 'Summary', icon: FileText, description: 'Concise summaries' },
] as const;

export default function ContentGeneratorPage() {
  const [selectedType, setSelectedType] = React.useState<string>('blog_post');
  const [prompt, setPrompt] = React.useState('');
  const [result, setResult] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResult('');

    try {
      const res = await apiPost<{ result: string }>('/api/ai/generate', {
        type: selectedType,
        prompt: prompt.trim(),
      });
      setResult(res.data.result ?? '');
    } catch (error) {
      setResult('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Generator"
        description="AI-powered content creation for your marketing needs"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Content Generator' },
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Panel */}
        <div className="space-y-4">
          {/* Content Type Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                      selectedType === type.id
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-border hover:border-emerald-200 hover:bg-muted/50'
                    }`}
                  >
                    <type.icon className="h-4 w-4 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Describe what you want to generate...\n\nExample: Write a blog post about the benefits of digital marketing for small businesses.`}
                className="w-full resize-none rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[150px]"
                disabled={isLoading}
              />
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Result Panel */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Generated Content</CardTitle>
            {result && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="mr-1 h-3.5 w-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {result ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-lg bg-muted/50 p-4 min-h-[300px]">
                {result}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
                <Sparkles className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">Generated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
