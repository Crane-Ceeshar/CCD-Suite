import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';
import { Card, CardContent } from './card';

const statCardVariants = cva('', {
  variants: {
    trend: {
      up: 'text-green-600',
      down: 'text-red-600',
      neutral: 'text-muted-foreground',
    },
  },
  defaultVariants: {
    trend: 'neutral',
  },
});

export interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  moduleColor?: string;
}

function StatCard({
  label,
  value,
  change,
  trend = 'neutral',
  icon,
  moduleColor,
  className,
  ...props
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className={cn('relative overflow-hidden', className)} {...props}>
      {moduleColor && (
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{ backgroundColor: moduleColor }}
        />
      )}
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold font-heading">{value}</p>
          </div>
          {icon && (
            <div className="rounded-lg bg-muted p-3">
              {icon}
            </div>
          )}
        </div>
        {change && (
          <div className={cn('mt-2 flex items-center gap-1 text-xs', statCardVariants({ trend }))}>
            <TrendIcon className="h-3 w-3" />
            <span>{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export { StatCard };
