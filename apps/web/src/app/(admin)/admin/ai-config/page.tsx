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
import { Save, Loader2, BrainCircuit } from 'lucide-react';
import { apiGet, apiPatch } from '@/lib/api';

interface AiSettings {
  id: string;
  preferred_model: string;
  max_tokens_per_request: number;
  monthly_token_budget: number;
  monthly_tokens_used: number;
  features_enabled: Record<string, boolean>;
}

const MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
  { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
];

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

  React.useEffect(() => {
    apiGet<AiSettings>('/api/admin/settings/ai')
      .then((res) => {
        if (res.data) {
          setSettings(res.data);
          setModel(res.data.preferred_model);
          setMaxTokens(res.data.max_tokens_per_request);
          setBudget(res.data.monthly_token_budget);
          setFeatures(res.data.features_enabled);
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
      });
      if (res.data) setSettings(res.data);
    } catch { /* ignore */ }
    setSaving(false);
  }

  const usagePercent = settings
    ? Math.min(100, Math.round((settings.monthly_tokens_used / settings.monthly_token_budget) * 100))
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
                {MODELS.map((m) => (
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
    </div>
  );
}
