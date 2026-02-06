import * as React from 'react';
import { cn } from '../lib/utils';
import { Badge } from '../primitives/badge';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  review: 'bg-purple-100 text-purple-800 border-purple-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  open: 'bg-blue-100 text-blue-800 border-blue-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200',
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: string;
  label?: string;
}

function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES['inactive'];
  const displayLabel = label ?? status.replace(/_/g, ' ');

  return (
    <Badge
      variant="outline"
      className={cn('capitalize', statusStyle, className)}
      {...props}
    >
      {displayLabel}
    </Badge>
  );
}

export { StatusBadge, STATUS_STYLES };
