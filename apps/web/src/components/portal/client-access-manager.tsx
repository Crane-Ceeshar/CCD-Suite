'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Badge, CcdSpinner } from '@ccd/ui';
import { Link2, Copy, Trash2, Check } from 'lucide-react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

interface AccessToken {
  id: string;
  client_email: string;
  portal_project_id: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

interface ClientAccessManagerProps {
  portalProjectId?: string;
}

export function ClientAccessManager({ portalProjectId }: ClientAccessManagerProps) {
  const [tokens, setTokens] = React.useState<AccessToken[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [expiryDays, setExpiryDays] = React.useState('7');
  const [generatedLink, setGeneratedLink] = React.useState('');
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const params = portalProjectId ? `?portal_project_id=${portalProjectId}` : '';
    apiGet<AccessToken[]>(`/api/portal/access/tokens${params}`)
      .then((res) => setTokens(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [portalProjectId]);

  async function handleGenerate() {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    setGenerating(true);
    setError('');
    setGeneratedLink('');

    try {
      const res = await apiPost<{ raw_token: string; id: string }>('/api/portal/access', {
        client_email: email.trim(),
        portal_project_id: portalProjectId ?? null,
        expires_in_days: parseInt(expiryDays, 10),
      });

      const link = `${window.location.origin}/portal/verify?token=${res.data.raw_token}`;
      setGeneratedLink(link);
      setEmail('');

      // Reload tokens
      const params = portalProjectId ? `?portal_project_id=${portalProjectId}` : '';
      const tokensRes = await apiGet<AccessToken[]>(`/api/portal/access/tokens${params}`);
      setTokens(tokensRes.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setGenerating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    try {
      await apiDelete(`/api/portal/access/tokens?id=${tokenId}`);
      setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    } catch {
      // ignore
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Generate Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Generate Access Link
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="client-email">Client Email</Label>
              <Input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div>
              <Label htmlFor="expiry">Expires In</Label>
              <select
                id="expiry"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
              </select>
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating}>
            {generating && <CcdSpinner size="sm" className="mr-2" />}
            Generate Link
          </Button>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {generatedLink && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <Input
                readOnly
                value={generatedLink}
                className="text-xs font-mono"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Tokens */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Access Links</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <CcdSpinner size="sm" />
            </div>
          ) : tokens.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No active access links. Generate one above.
            </p>
          ) : (
            <div className="space-y-2">
              {tokens.map((token) => {
                const isExpired = new Date(token.expires_at) < new Date();
                const isUsed = !!token.used_at;
                return (
                  <div key={token.id} className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{token.client_email}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>Expires: {new Date(token.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {isUsed && <span>Used: {new Date(token.used_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                      </div>
                    </div>
                    {isExpired ? (
                      <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Expired</Badge>
                    ) : isUsed ? (
                      <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Used</Badge>
                    ) : (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRevoke(token.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
