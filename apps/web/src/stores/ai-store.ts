import { create } from 'zustand';
import type { AiConversation, AiMessage } from '@ccd/shared';

interface AIState {
  conversations: AiConversation[];
  activeConversationId: string | null;
  messages: AiMessage[];
  isStreaming: boolean;
  isLoading: boolean;
  streamingContent: string;

  setConversations: (conversations: AiConversation[]) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (messages: AiMessage[]) => void;
  addMessage: (message: AiMessage) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingContent: (chunk: string) => void;
  reset: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isStreaming: false,
  isLoading: false,
  streamingContent: '',

  setConversations: (conversations) => set({ conversations }),
  setActiveConversationId: (activeConversationId) =>
    set({ activeConversationId, messages: [], streamingContent: '' }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setStreamingContent: (streamingContent) => set({ streamingContent }),
  appendStreamingContent: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  reset: () =>
    set({
      activeConversationId: null,
      messages: [],
      isStreaming: false,
      isLoading: false,
      streamingContent: '',
    }),
}));
