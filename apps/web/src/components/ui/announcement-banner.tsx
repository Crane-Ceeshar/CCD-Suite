'use client';

import * as React from 'react';
import { X, Info, AlertTriangle, AlertOctagon } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical';
}

const TYPE_CONFIG = {
  info: {
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: Info,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    icon: AlertTriangle,
  },
  critical: {
    bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    icon: AlertOctagon,
  },
};

const STORAGE_KEY = 'dismissed-announcements';

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = React.useState<Announcement[]>([]);
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    // Load dismissed IDs from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }

    // Fetch active announcements
    fetch('/api/admin/announcements/active')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setAnnouncements(res.data);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss(id: string) {
    const newDismissed = new Set(dismissed);
    newDismissed.add(id);
    setDismissed(newDismissed);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...newDismissed]));
    } catch { /* ignore */ }
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {visible.map((a) => {
        const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div
            key={a.id}
            className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${cfg.bg}`}
          >
            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${cfg.text}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${cfg.text}`}>{a.title}</p>
              <p className={`text-xs mt-0.5 ${cfg.text} opacity-80`}>{a.message}</p>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              className={`flex-shrink-0 rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${cfg.text}`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
