import { create } from 'zustand';
import type { Notification } from '../types';
import * as api from '../api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  sendNotification: (data: { user_id: string; type: string; title: string; content?: string }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await api.getNotifications();
      set({ notifications, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  sendNotification: async (data) => {
    await api.sendNotification(data);
  },

  markAsRead: async (id) => {
    await api.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  },

  markAllAsRead: async () => {
    await api.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, is_read: true })),
      unreadCount: 0
    }));
  },

  deleteNotification: async (id) => {
    await api.deleteNotification(id);
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: notification && !notification.is_read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount
      };
    });
  },

  fetchUnreadCount: async () => {
    try {
      const count = await api.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // 忽略错误，保持当前状态
    }
  },
}));