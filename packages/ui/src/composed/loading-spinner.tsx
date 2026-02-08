import * as React from 'react';
import { CcdSpinner } from './ccd-spinner';
import { cn } from '../lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
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
      <CcdSpinner size={sizeMap[size]} className="text-muted-foreground" />
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

export { LoadingSpinner };
