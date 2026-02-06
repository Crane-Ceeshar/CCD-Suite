'use client';

import * as React from 'react';
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Separator,
  Badge,
} from '@ccd/ui';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { formatRelativeTime } from '@ccd/shared';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  module: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  mention: Info,
  assignment: Info,
  update: Info,
  reminder: AlertTriangle,
};

export function NotificationBell() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={markAllRead}>
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((notification) => {
              const Icon = TYPE_ICONS[notification.type] || Info;
              return (
                <div
                  key={notification.id}
                  className={`flex gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50 ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                >
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
