'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CcdSpinner,
} from '@ccd/ui';
import { Link2, User, Building2, Sparkles } from 'lucide-react';
import { apiPost } from '@/lib/api';

// ── Platform Config ──────────────────────────────────────────────────

const platformConfigs = [
  {
    id: 'facebook',
    label: 'Facebook',
    color: '#1877F2',
    urlPatterns: ['facebook.com/', 'fb.com/'],
    placeholder: 'https://facebook.com/yourpage',
    handlePrefix: '',
    extractHandle: (url: string) => {
      const match = url.match(/(?:facebook\.com|fb\.com)\/(?:profile\.php\?id=)?([^/?&#]+)/i);
      return match?.[1] ?? null;
    },
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: '#E4405F',
    urlPatterns: ['instagram.com/'],
    placeholder: 'https://instagram.com/yourhandle',
    handlePrefix: '@',
    extractHandle: (url: string) => {
      const match = url.match(/instagram\.com\/([^/?&#]+)/i);
      return match?.[1] ?? null;
    },
  },
  {
    id: 'twitter',
    label: 'X (Twitter)',
    color: '#000000',
    urlPatterns: ['twitter.com/', 'x.com/'],
    placeholder: 'https://x.com/yourhandle',
    handlePrefix: '@',
    extractHandle: (url: string) => {
      const match = url.match(/(?:twitter\.com|x\.com)\/([^/?&#]+)/i);
      return match?.[1] ?? null;
    },
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    color: '#0A66C2',
    urlPatterns: ['linkedin.com/in/', 'linkedin.com/company/'],
    placeholder: 'https://linkedin.com/in/yourprofile',
    handlePrefix: '',
    extractHandle: (url: string) => {
      const match = url.match(/linkedin\.com\/(?:in|company)\/([^/?&#]+)/i);
      return match?.[1] ?? null;
    },
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    color: '#000000',
    urlPatterns: ['tiktok.com/@'],
    placeholder: 'https://tiktok.com/@yourhandle',
    handlePrefix: '@',
    extractHandle: (url: string) => {
      const match = url.match(/tiktok\.com\/@([^/?&#]+)/i);
      return match?.[1] ?? null;
    },
  },
  {
    id: 'youtube',
    label: 'YouTube',
    color: '#FF0000',
    urlPatterns: ['youtube.com/@', 'youtube.com/c/', 'youtube.com/channel/'],
    placeholder: 'https://youtube.com/@yourchannel',
    handlePrefix: '',
    extractHandle: (url: string) => {
      const match = url.match(/youtube\.com\/(?:@|c\/|channel\/)([^/?&#]+)/i);
      return match?.[1] ?? null;
    },
  },
];

const accountTypes = [
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'business', label: 'Business', icon: Building2 },
  { id: 'creator', label: 'Creator', icon: Sparkles },
];

// ── URL → Platform Detection ─────────────────────────────────────────

function detectPlatformFromUrl(url: string): string | null {
  const lower = url.toLowerCase();
  for (const cfg of platformConfigs) {
    if (cfg.urlPatterns.some((p) => lower.includes(p))) {
      return cfg.id;
    }
  }
  return null;
}

function validateProfileUrl(url: string, platformId: string): string | null {
  if (!url.trim()) return null;
  const cfg = platformConfigs.find((p) => p.id === platformId);
  if (!cfg) return 'Unknown platform';

  const lower = url.toLowerCase();
  const matchesPlatform = cfg.urlPatterns.some((p) => lower.includes(p));
  if (!matchesPlatform) {
    return `URL doesn't match ${cfg.label}. Expected a URL containing: ${cfg.urlPatterns.join(' or ')}`;
  }

  const handle = cfg.extractHandle(url);
  if (!handle) {
    return `Could not extract account handle from URL`;
  }

  return null; // valid
}

// ── Form State ──────────────────────────────────────────────────────

interface AccountFormData {
  platform: string;
  profile_url: string;
  display_name: string;
  account_type: string;
}

interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const initialForm: AccountFormData = {
  platform: 'facebook',
  profile_url: '',
  display_name: '',
  account_type: 'business',
};

// ── Component ───────────────────────────────────────────────────────

export function AccountDialog({ open, onOpenChange, onSuccess }: AccountDialogProps) {
  const [form, setForm] = React.useState<AccountFormData>(initialForm);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [urlError, setUrlError] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setForm(initialForm);
      setError('');
      setUrlError('');
    }
  }, [open]);

  function update(field: keyof AccountFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'profile_url') setUrlError('');
  }

  // Auto-detect platform from pasted URL
  function handleUrlChange(value: string) {
    update('profile_url', value);
    const detected = detectPlatformFromUrl(value);
    if (detected && detected !== form.platform) {
      setForm((prev) => ({ ...prev, profile_url: value, platform: detected }));
    }

    // Auto-extract display name from URL
    if (value.trim()) {
      const cfg = platformConfigs.find((p) => p.id === (detected ?? form.platform));
      const handle = cfg?.extractHandle(value);
      if (handle) {
        const prefix = cfg?.handlePrefix ?? '';
        setForm((prev) => ({
          ...prev,
          profile_url: value,
          platform: detected ?? prev.platform,
          display_name: prev.display_name || `${prefix}${handle}`,
        }));
      }
    }
  }

  const selectedPlatform = platformConfigs.find((p) => p.id === form.platform);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Require either profile URL or display name
    if (!form.profile_url.trim() && !form.display_name.trim()) {
      setError('Please provide a profile URL or display name');
      return;
    }

    // Validate URL if provided
    if (form.profile_url.trim()) {
      const validation = validateProfileUrl(form.profile_url, form.platform);
      if (validation) {
        setUrlError(validation);
        return;
      }
    }

    setSaving(true);
    setError('');
    setUrlError('');

    try {
      // Extract handle from URL
      const handle = selectedPlatform?.extractHandle(form.profile_url) ?? null;
      const displayName = form.display_name.trim() || (handle ? `${selectedPlatform?.handlePrefix ?? ''}${handle}` : '');

      // Generate avatar URL using platform-specific patterns
      const avatarUrl = handle ? `https://unavatar.io/${form.platform}/${handle}` : null;

      await apiPost('/api/social/accounts', {
        platform: form.platform,
        account_name: displayName,
        account_id: form.profile_url.trim() || null,
        avatar_url: avatarUrl,
        metadata: {
          profile_url: form.profile_url.trim() || null,
          account_type: form.account_type,
          display_name: displayName,
          handle: handle ?? displayName,
        },
      });
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Social Account</DialogTitle>
          <DialogDescription>
            Paste your profile URL to automatically detect the platform and extract your handle
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile URL — main input */}
          <FormField label="Profile URL">
            <div className="relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={form.profile_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={selectedPlatform?.placeholder ?? 'https://...'}
                className="pl-9"
              />
            </div>
            {urlError && <p className="text-xs text-destructive mt-1">{urlError}</p>}
          </FormField>

          {/* Platform selector */}
          <FormField label="Platform" required>
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full shrink-0 transition-colors"
                style={{ backgroundColor: selectedPlatform?.color ?? '#888' }}
              />
              <Select value={form.platform} onValueChange={(v) => update('platform', v)}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {platformConfigs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FormField>

          {/* Display Name */}
          <FormField label="Display Name">
            <Input
              value={form.display_name}
              onChange={(e) => update('display_name', e.target.value)}
              placeholder={selectedPlatform?.handlePrefix ? `${selectedPlatform.handlePrefix}yourhandle` : 'Your Page Name'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Auto-filled from URL. Edit to customize.
            </p>
          </FormField>

          {/* Account Type */}
          <FormField label="Account Type">
            <div className="flex gap-2">
              {accountTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = form.account_type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => update('account_type', type.id)}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary font-medium'
                        : 'border-input bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </FormField>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <CcdSpinner size="sm" className="mr-2" />}
              Connect Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
