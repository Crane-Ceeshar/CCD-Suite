import * as React from 'react';
import { cn } from '../lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '../primitives/avatar';

export interface UserAvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function UserAvatar({
  name,
  imageUrl,
  size = 'md',
  className,
  ...props
}: UserAvatarProps) {
  return (
    <Avatar className={cn(sizeMap[size], className)} {...props}>
      {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
      <AvatarFallback className={cn(sizeMap[size])}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export { UserAvatar };
