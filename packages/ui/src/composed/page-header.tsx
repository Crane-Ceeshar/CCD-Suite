import * as React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
}

function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-2', className)} {...props}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight className="h-3 w-3" />}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-foreground">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight font-heading">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export { PageHeader };
