import * as React from 'react';
import { cn } from '../lib/utils';

interface CcdLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 24,
  md: 40,
  lg: 56,
};

function CcdLogoArrow({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 525 448.86"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M525,0l-210.32,140.44c-9.99.44-19.05-2.32-29.3-2.4-46.8-.26-88.04,18.28-117.71,47.65L0,142.58,525,0h0Z" />
      <polygon points="525 0 219.53 448.86 235.08 253.87 525 0" />
      <path d="M274.44,177.18c-10.5,8.7-22.66,19.13-34.68,27.38h0c-.88.63-1.73,1.22-2.65,1.81-8.18,5.27-19.38,9.1-22.26-3.91-.26-1.14-.41-2.28-.48-3.35-.88-14.59,13.52-26.75,26.79-29.92,10.1-2.43,23.03-.66,31.29,5.86.52.41,1.47,1.51,1.99,2.14h0Z" />
    </svg>
  );
}

function CcdLoader({ size = 'lg', className }: CcdLoaderProps) {
  const px = SIZE_MAP[size];

  return (
    <div
      className={cn('relative overflow-hidden flex items-center justify-center text-ccd-blue', className)}
      style={{ width: px * 1.2, height: px * 2 }}
    >
      <CcdLogoArrow
        className="absolute animate-arrow-shoot"
        style={{ width: px, height: px * 0.85 }}
      />
      <CcdLogoArrow
        className="absolute animate-arrow-shoot-delayed opacity-70"
        style={{ width: px * 0.7, height: px * 0.6 }}
      />
      <CcdLogoArrow
        className="absolute animate-arrow-shoot-delayed-2 opacity-40"
        style={{ width: px * 0.45, height: px * 0.38 }}
      />
    </div>
  );
}

export { CcdLoader };
