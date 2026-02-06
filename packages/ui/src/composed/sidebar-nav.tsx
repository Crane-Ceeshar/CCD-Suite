import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../primitives/button';
import { ScrollArea } from '../primitives/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '../primitives/tooltip';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  active?: boolean;
  children?: NavItem[];
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface SidebarNavProps {
  groups: NavGroup[];
  collapsed?: boolean;
  onNavigate?: (href: string) => void;
  className?: string;
}

function SidebarNav({
  groups,
  collapsed = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  const [openGroups, setOpenGroups] = React.useState<Set<string>>(new Set());

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-4 py-4">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="px-3">
            {group.label && !collapsed && (
              <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isOpen = openGroups.has(item.label);

                const button = (
                  <Button
                    key={item.href}
                    variant={item.active ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full',
                      collapsed ? 'justify-center px-2' : 'justify-start',
                      item.active && 'bg-primary/10 text-primary hover:bg-primary/15'
                    )}
                    onClick={() => {
                      if (hasChildren) {
                        toggleGroup(item.label);
                      } else {
                        onNavigate?.(item.href);
                      }
                    }}
                  >
                    {item.icon && (
                      <span className={cn(collapsed ? '' : 'mr-2')}>
                        {item.icon}
                      </span>
                    )}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.badge != null && (
                          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            {item.badge}
                          </span>
                        )}
                        {hasChildren && (
                          <ChevronDown
                            className={cn(
                              'ml-1 h-4 w-4 transition-transform',
                              isOpen && 'rotate-180'
                            )}
                          />
                        )}
                      </>
                    )}
                  </Button>
                );

                return (
                  <React.Fragment key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{button}</TooltipTrigger>
                        <TooltipContent side="right">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      button
                    )}
                    {hasChildren && isOpen && !collapsed && (
                      <div className="ml-4 space-y-1">
                        {item.children!.map((child) => (
                          <Button
                            key={child.href}
                            variant={child.active ? 'secondary' : 'ghost'}
                            size="sm"
                            className={cn(
                              'w-full justify-start',
                              child.active && 'bg-primary/10 text-primary hover:bg-primary/15'
                            )}
                            onClick={() => onNavigate?.(child.href)}
                          >
                            {child.icon && <span className="mr-2">{child.icon}</span>}
                            {child.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}

export { SidebarNav };
