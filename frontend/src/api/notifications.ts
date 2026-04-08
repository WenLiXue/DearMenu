import api from './index';
import type { Notification } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get<{data: Notification[]}>('/notifications', { headers: getAuthHeaders() });
  return response.data;  // interceptor returns response.data = {code, message, data: [...]}, response.data IS the data field which is the array
};

export const sendNotification = async (data: {
  user_id: string;
  type: string;
  title: string;
  content?: string;
}): Promise<Notification> => {
  const notification = await api.post<Notification>('/notifications', data, { headers: getAuthHeaders() });
  return notification;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.put(`/notifications/${id}/read`, {}, { headers: getAuthHeaders() });
};

export const markAllAsRead = async (): Promise<void> => {
  await api.put('/notifications/read-all', {}, { headers: getAuthHeaders() });
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`, { headers: getAuthHeaders() });
};

export const getUnreadCount = async (): Promise<number> => {
  const data = await api.get<{ unread_count: number }>('/notifications/unread-count', { headers: getAuthHeaders() });
  return data.unread_count;
};