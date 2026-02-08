'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
} from '../primitives';
import { cn } from '../lib/utils';

export interface ModuleSettingsTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

export interface ModuleSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  tabs: ModuleSettingsTab[];
  defaultTab?: string;
  moduleColor?: string;
  icon?: React.ReactNode;
}

function ModuleSettingsDialog({
  open,
  onOpenChange,
  title,
  description,
  tabs,
  defaultTab,
  moduleColor,
  icon,
}: ModuleSettingsDialogProps) {
  const firstTab = defaultTab || tabs[0]?.value || '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-[800px] w-[95vw] p-0 gap-0 max-h-[85vh] flex flex-col'
        )}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {icon && (
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 [&>svg]:h-5 [&>svg]:w-5"
                  style={{
                    backgroundColor: moduleColor ? `${moduleColor}15` : undefined,
                    color: moduleColor || undefined,
                  }}
                >
                  {icon}
                </div>
              )}
              <span className="text-lg font-semibold">{title}</span>
            </DialogTitle>
            {description && (
              <DialogDescription className="mt-1">{description}</DialogDescription>
            )}
          </DialogHeader>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={firstTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b">
            <TabsList className="h-auto p-0 bg-transparent gap-0 w-full justify-start">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  <span className="flex items-center gap-2">
                    {tab.icon && (
                      <span className="[&>svg]:h-4 [&>svg]:w-4">{tab.icon}</span>
                    )}
                    {tab.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab content — scrollable */}
          <div className="flex-1 min-h-0">
            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-0 h-full data-[state=inactive]:hidden"
              >
                <ScrollArea className="h-full max-h-[calc(85vh-180px)]">
                  <div className="p-6">{tab.content}</div>
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export { ModuleSettingsDialog };
