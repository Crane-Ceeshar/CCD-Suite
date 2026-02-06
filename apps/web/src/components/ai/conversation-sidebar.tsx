'use client';

import * as React from 'react';
import { Plus, MessageCircle, Trash2 } from 'lucide-react';
import { Button, cn } from '@ccd/ui';
import type { AiConversation } from '@ccd/shared';

interface ConversationSidebarProps {
  conversations: AiConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: ConversationSidebarProps) {
  return (
    <div className="flex flex-col h-full border-r bg-muted/30">
      <div className="p-3 border-b">
        <Button onClick={onNew} className="w-full" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                  activeId === conv.id
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'hover:bg-muted'
                )}
                onClick={() => onSelect(conv.id)}
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 truncate">
                  {conv.title || 'Untitled conversation'}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
