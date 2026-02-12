'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  CcdLoader,
  CcdSpinner,
} from '@ccd/ui';
import { Save, BrainCircuit, MessageSquare, Cpu, Clock } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface AiSettings {
  id: string;
  preferred_model: string;
  max_tokens_per_request: number;
  monthly_token_budget: number;
  monthly_tokens_used: number;
  features_enabled: Record<string, boolean>;
  system_prompt?: string;
  available_models?: string[];
  conversation_retention_days?: number;
  insight_retention_days?: number;
  generation_retention_days?: number;
  last_token_reset_at?: string | null;
}

const ALL_MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Best balance of intelligence and speed', tier: 'recommended' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', description: 'Previous-gen high-performance model', tier: 'standard' },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku', description: 'Fastest, most cost-effective for simple tasks', tier: 'economy' },
];

const DEFAULT_AVAILABLE_MODELS = ALL_MODELS.map((m) => m.id);

const FEATURES = [
  { key: 'chat', label: 'AI Chat', description: 'Interactive AI assistant for all modules' },
  { key: 'content_generation', label: 'Content Generation', description: 'AI-powered blog posts, captions, ad copy' },
  { key: 'insights', label: 'Smart Insights', description: 'AI-generated business insights from data' },
  { key: 'automations', label: 'Automations', description: 'AI-powered workflow automations' },
];

export default function AdminAiConfigPage() {
  const [settings, setSettings] = React.useState<AiSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [model, setModel] = React.useState('claude-sonnet-4-20250514');
  const [maxTokens, setMaxTokens] = React.useState(4096);
  const [budget, setBudget] = React.useState(1000000);
  const [features, setFeatures] = React.useState<Record<string, boolean>>({
    chat: true,
    content_generation: true,
    insights: true,
    automations: false,
  });
  const [systemPrompt, setSystemPrompt] = React.useState('');
  const [availableModels, setAvailableModels] = React.useState<string[]>(DEFAULT_AVAILABLE_MODELS);
  const [convRetention, setConvRetention] = React.useState(90);
  const [insightRetention, setInsightRetention] = React.useState(180);
  const [genRetention, setGenRetention] = React.useState(90);

  React.useEffect(() => {
    apiGet<AiSettings>('/api/admin/settings/ai')
      .then((res) => {
        if (res.data) {
          setSettings(res.data);
          setModel(res.data.preferred_model);
          setMaxTokens(res.data.max_tokens_per_request);
          setBudget(res.data.monthly_token_budget);
          setFeatures(res.data.features_enabled);
          setSystemPrompt(res.data.system_prompt ?? '');
          setAvailableModels(res.data.available_models ?? DEFAULT_AVAILABLE_MODELS);
          setConvRetention(res.data.conversation_retention_days ?? 90);
          setInsightRetention(res.data.insight_retention_days ?? 180);
          setGenRetention(res.data.generation_retention_days ?? 90);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiPatch<AiSettings>('/api/admin/settings/ai', {
        preferred_model: model,
        max_tokens_per_request: maxTokens,
        monthly_token_budget: budget,
        features_enabled: features,
        system_prompt: systemPrompt,
        available_models: availableModels,
        conversation_retention_days: convRetention,
        insight_retention_days: insightRetention,
        generation_retention_days: genRetention,
      });
      if (res.data) setSettings(res.data);
    } catch { /* ignore */ }
    setSaving(false);
  }

  function toggleModel(modelId: string) {
    setAvailableModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((m) => m !== modelId)
        : [...prev, modelId]
    );
  }

  const usagePercent = settings
    ? Math.min(100, Math.round((settings.monthly_tokens_used / settings.monthly_token_budget) * 100))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CcdLoader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Configuration"
        description="Manage AI model preferences, token budgets, and enabled features"
        actions={
          <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
            {saving ? <CcdSpinner size="sm" className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Model & Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="h-4 w-4" />
              Model Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Preferred Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {ALL_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Max Tokens Per Request</label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 4096)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                min={256}
                max={32000}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Monthly Token Budget</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(parseInt(e.target.value, 10) || 1000000)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                min={10000}
                step={100000}
              />
            </div>
            {settings && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Tokens used this month</span>
                  <span className="font-medium">
                    {settings.monthly_tokens_used.toLocaleString()} / {settings.monthly_token_budget.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${usagePercent}%`,
                      backgroundColor: usagePercent > 80 ? '#DC2626' : usagePercent > 50 ? '#F59E0B' : '#10B981',
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {FEATURES.map((feat) => (
              <label
                key={feat.key}
                className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">{feat.label}</p>
                  <p className="text-xs text-muted-foreground">{feat.description}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={features[feat.key] ?? false}
                  onClick={() => setFeatures({ ...features, [feat.key]: !features[feat.key] })}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    features[feat.key] ? 'bg-red-500' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      features[feat.key] ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* System Prompt */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            System Prompt
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Customise the AI assistant&apos;s behaviour. The system prompt is prepended to every conversation and shapes how the AI responds.
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={`Example:\nYou are a helpful AI assistant for ${settings ? 'our' : 'a'} digital agency. Always be professional, concise, and use British English spelling. When discussing data, cite specific numbers. Never provide financial or legal advice.`}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[140px] resize-y"
            maxLength={4000}
          />
          <p className="text-xs text-muted-foreground text-right">
            {systemPrompt.length} / 4,000 characters
          </p>
        </CardContent>
      </Card>

      {/* Available Models */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            Available Models
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select which AI models are available for your organisation. The preferred model (set above) will be used as the default.
          </p>
          {ALL_MODELS.map((m) => {
            const isChecked = availableModels.includes(m.id);
            const isPreferred = model === m.id;
            return (
              <label
                key={m.id}
                className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-muted/50 ${
                  isPreferred ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleModel(m.id)}
                    disabled={isPreferred}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 h-4 w-4"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {m.label}
                      {isPreferred && (
                        <span className="ml-2 text-xs text-red-600 font-normal">(Preferred)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{m.tier}</span>
              </label>
            );
          })}
        </CardContent>
      </Card>

      {/* Data Retention */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Data Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure how long AI data is retained before automatic cleanup. Set to 0 to keep data forever.
            Token usage resets automatically on the 1st of each month.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Conversations</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={convRetention}
                  onChange={(e) => setConvRetention(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  min={0}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Insights</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={insightRetention}
                  onChange={(e) => setInsightRetention(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  min={0}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Generation Jobs</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={genRetention}
                  onChange={(e) => setGenRetention(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  min={0}
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">days</span>
              </div>
            </div>
          </div>
          {settings?.last_token_reset_at && (
            <p className="text-xs text-muted-foreground">
              Last token reset: {new Date(settings.last_token_reset_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
