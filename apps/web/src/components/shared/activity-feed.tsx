'use client';

import * as React from 'react';
import {
  FileEdit,
  Trash2,
  CheckCircle,
  BarChart3,
  Settings,
  Activity,
  type LucideIcon,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, Skeleton } from '@ccd/ui';
import { formatRelativeTime } from '@ccd/shared';

export interface ActivityEntry {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  user_name: string | null;
  user_avatar: string | null;
  created_at: string;
}

interface ActivityFeedProps {
  activities: ActivityEntry[];
  isLoading?: boolean;
}

const ACTION_ICONS: Record<string, LucideIcon> = {
  'content.updated': FileEdit,
  'content.deleted': Trash2,
  'content.archived': Trash2,
  'content.approval.approve': CheckCircle,
  'content.approval.reject': Trash2,
  'dashboard.updated': BarChart3,
  'dashboard.deleted': Trash2,
  'settings.updated': Settings,
};

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='flex gap-3'>
            <Skeleton className='h-8 w-8 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-1/4' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className='py-8 text-center text-sm text-muted-foreground'>
        No recent activity
      </div>
    );
  }

  return (
    <div className='space-y-1'>
      {activities.map((entry) => {
        const Icon = ACTION_ICONS[entry.action] || Activity;
        const summary = (entry.details as Record<string,string>)?.summary || entry.action;
        return (
          <div key={entry.id} className='flex gap-3 rounded-lg px-3 py-2 hover:bg-muted/50'>
            <Avatar className='h-8 w-8'>
              {entry.user_avatar && <AvatarImage src={entry.user_avatar} />}
              <AvatarFallback className='text-xs'>{getInitials(entry.user_name)}</AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <Icon className='h-3.5 w-3.5 text-muted-foreground flex-shrink-0' />
                <p className='text-sm truncate'>
                  <span className='font-medium'>{entry.user_name || 'Unknown'}</span>
                  {' '}
                  <span className='text-muted-foreground'>{summary}</span>
                </p>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {formatRelativeTime(entry.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}