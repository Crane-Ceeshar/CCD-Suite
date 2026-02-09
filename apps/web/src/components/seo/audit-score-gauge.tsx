'use client';

import * as React from 'react';

interface AuditScoreGaugeProps {
  score: number;
  size?: number;
}

export function AuditScoreGauge({ score, size = 120 }: AuditScoreGaugeProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let color = '#ef4444'; // red
  if (score >= 80) color = '#22c55e'; // green
  else if (score >= 60) color = '#eab308'; // yellow

  const fontSize = size * 0.28;
  const labelSize = size * 0.1;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{
            transition: 'stroke-dashoffset 1s ease-out',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-bold" style={{ fontSize, lineHeight: 1, color }}>
          {clampedScore}
        </span>
        <span className="text-muted-foreground" style={{ fontSize: labelSize }}>
          / 100
        </span>
      </div>
    </div>
  );
}
