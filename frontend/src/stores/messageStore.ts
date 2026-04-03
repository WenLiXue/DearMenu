import { create } from 'zustand';
import type { Message, Conversation } from '../types';
import * as api from '../api/messages';

interface MessageState {
  conversations: Conversation[];
  currentMessages: Message[];
  unreadCount: number;
  isLoading: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (userId: string) => Promise<void>;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  currentMessages: [],
  unreadCount: 0,
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const conversations = await api.getConversations();
      set({ conversations, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (userId: string) => {
    set({ isLoading: true });
    try {
      const messages = await api.getConversation(userId);
      set({ currentMessages: messages, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  sendMessage: async (receiverId: string, content: string) => {
    const message = await api.sendMessage({ receiver_id: receiverId, content });
    set((state) => ({
      currentMessages: [message, ...state.currentMessages]
    }));
  },

  fetchUnreadCount: async () => {
    try {
      const count = await api.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // 忽略错误
    }
  },
}));