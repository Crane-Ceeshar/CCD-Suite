'use client';

import * as React from 'react';
import { toast } from '@ccd/ui';
import { apiGet, apiPatch } from '@/lib/api';

interface UseModuleSettingsOptions<T> {
  module: string;
  key: string;
  defaults: T;
}

interface UseModuleSettingsReturn<T> {
  settings: T;
  setSettings: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  loading: boolean;
  saving: boolean;
  save: () => Promise<void>;
  isDirty: boolean;
}

export function useModuleSettings<T extends Record<string, any>>({
  module,
  key,
  defaults,
}: UseModuleSettingsOptions<T>): UseModuleSettingsReturn<T> {
  const [settings, setSettings] = React.useState<T>(defaults);
  const [snapshot, setSnapshot] = React.useState<string>(JSON.stringify(defaults));
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const isDirty = JSON.stringify(settings) !== snapshot;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGet<T | null>(
      `/api/settings/module?module=${encodeURIComponent(module)}&key=${encodeURIComponent(key)}`
    )
      .then((res) => {
        if (!cancelled && res.data) {
          // The API returns the raw value object directly in res.data
          const merged = { ...defaults, ...(res.data as T) };
          setSettings(merged);
          setSnapshot(JSON.stringify(merged));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, key]);

  const updateField = React.useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setSettings((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const save = React.useCallback(async () => {
    setSaving(true);
    try {
      const res = await apiPatch<{ key: string; value: T }>('/api/settings/module', {
        module,
        key,
        value: settings,
      });
      if (res.data?.value) {
        const merged = { ...defaults, ...res.data.value };
        setSettings(merged);
        setSnapshot(JSON.stringify(merged));
      } else {
        setSnapshot(JSON.stringify(settings));
      }
      toast({ title: 'Settings saved', description: 'Your changes have been saved.' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, key, settings]);

  return { settings, setSettings, updateField, loading, saving, save, isDirty };
}
