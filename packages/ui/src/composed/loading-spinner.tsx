import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

function LoadingSpinner({
  size = 'md',
  label,
  className,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-2', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeMap[size])} />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

export { LoadingSpinner };
