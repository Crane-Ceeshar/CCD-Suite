import * as React from 'react';
import {
  Users,
  BarChart3,
  PenTool,
  Search,
  Share2,
  LayoutGrid,
  FolderKanban,
  Wallet,
  Building2,
} from 'lucide-react';
import { cn } from '../lib/utils';

const MODULE_ICONS: Record<string, React.ElementType> = {
  crm: Users,
  analytics: BarChart3,
  content: PenTool,
  seo: Search,
  social: Share2,
  client_portal: LayoutGrid,
  projects: FolderKanban,
  finance: Wallet,
  hr: Building2,
};

const MODULE_COLORS: Record<string, string> = {
  crm: '#0047AB',
  analytics: '#8B5CF6',
  content: '#EC4899',
  seo: '#9BBD2B',
  social: '#F59E0B',
  client_portal: '#06B6D4',
  projects: '#6366F1',
  finance: '#14B8A6',
  hr: '#F97316',
};

export interface ModuleIconProps extends React.HTMLAttributes<HTMLDivElement> {
  moduleId: string;
  size?: 'sm' | 'md' | 'lg';
  colored?: boolean;
  withBackground?: boolean;
}

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const bgSizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

function ModuleIcon({
  moduleId,
  size = 'md',
  colored = true,
  withBackground = false,
  className,
  ...props
}: ModuleIconProps) {
  const Icon = MODULE_ICONS[moduleId];
  const color = MODULE_COLORS[moduleId];

  if (!Icon) return null;

  const iconElement = (
    <Icon
      className={cn(iconSizeMap[size])}
      style={colored && color ? { color } : undefined}
    />
  );

  if (withBackground) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-lg',
          bgSizeMap[size],
          className
        )}
        style={color ? { backgroundColor: `${color}15` } : undefined}
        {...props}
      >
        {iconElement}
      </div>
    );
  }

  return (
    <span className={cn('inline-flex', className)} {...props}>
      {iconElement}
    </span>
  );
}

export { ModuleIcon, MODULE_ICONS, MODULE_COLORS };
