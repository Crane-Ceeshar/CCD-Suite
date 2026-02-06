'use client';

import { PageHeader } from '@ccd/ui';
import { ChatInterface } from '@/components/ai/chat-interface';

export default function AIAssistantPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Assistant"
        description="Chat with CCD AI to get help across all your modules"
        breadcrumbs={[
          { label: 'AI', href: '/ai' },
          { label: 'Assistant' },
        ]}
      />
      <ChatInterface />
    </div>
  );
}
