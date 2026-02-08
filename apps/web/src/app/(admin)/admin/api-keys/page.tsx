'use client';

import * as React from 'react';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  CcdLoader,
} from '@ccd/ui';
import { Plus, Loader2, Copy, Check, RefreshCw, Trash2, KeyRound } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export default function AdminApiKeysPage() {
  const [keys, setKeys] = React.useState<ApiKey[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [revealedKey, setRevealedKey] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const res = await apiGet<ApiKey[]>('/api/admin/api-keys');
      setKeys(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await apiPost<ApiKey & { key: string }>('/api/admin/api-keys', {
        name: newKeyName.trim(),
        scopes: ['read', 'write'],
      });
      setRevealedKey(res.data.key);
      setNewKeyName('');
      setShowCreate(false);
      await loadKeys();
    } catch { /* ignore */ }
    setCreating(false);
  }

  async function handleRotate(id: string) {
    try {
      const res = await apiPatch<ApiKey & { key: string }>(`/api/admin/api-keys/${id}/rotate`, {});
      setRevealedKey(res.data.key);
      await loadKeys();
    } catch { /* ignore */ }
  }

  async function handleDeactivate(id: string) {
    try {
      await apiDelete(`/api/admin/api-keys/${id}`);
      await loadKeys();
    } catch { /* ignore */ }
  }

  function copyKey() {
    if (revealedKey) {
      navigator.clipboard.writeText(revealedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Manage API keys for third-party integrations"
        actions={
          <Button onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Key
          </Button>
        }
      />

      {/* Revealed Key Banner */}
      {revealedKey && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Copy your API key now — it will not be shown again
                </p>
                <code className="mt-1 block text-xs bg-card rounded px-2 py-1 font-mono border">
                  {revealedKey}
                </code>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyKey}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRevealedKey(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="flex gap-3 items-end">
              <div className="space-y-1 flex-1">
                <label className="text-xs font-medium text-muted-foreground">Key Name</label>
                <input
                  type="text"
                  required
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="e.g. Production API"
                />
              </div>
              <Button type="submit" disabled={creating} className="bg-red-600 hover:bg-red-700">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <CcdLoader size="lg" />
        </div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <KeyRound className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">No API Keys</p>
            <p className="text-sm text-muted-foreground">Create your first API key to enable integrations.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium p-3">Name</th>
                  <th className="text-left font-medium p-3">Key</th>
                  <th className="text-left font-medium p-3">Status</th>
                  <th className="text-left font-medium p-3">Last Used</th>
                  <th className="text-left font-medium p-3">Created</th>
                  <th className="text-right font-medium p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium">{key.name}</td>
                    <td className="p-3">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                        {key.key_prefix}...
                      </code>
                    </td>
                    <td className="p-3">
                      <Badge variant={key.is_active ? 'default' : 'secondary'}>
                        {key.is_active ? 'Active' : 'Revoked'}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(key.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      {key.is_active && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleRotate(key.id)}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeactivate(key.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
