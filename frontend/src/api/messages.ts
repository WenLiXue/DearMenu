import api from './index';
import type { Message, Conversation } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getConversations = async (): Promise<Conversation[]> => {
  const response = await api.get<Conversation[]>('/messages/conversations', { headers: getAuthHeaders() });
  return response.data;
};

export const getConversation = async (userId: string, limit = 50, offset = 0): Promise<Message[]> => {
  const response = await api.get<Message[]>('/messages', {
    headers: getAuthHeaders(),
    params: { conversation_with: userId, limit, offset }
  });
  return response.data;
};

export const sendMessage = async (data: {
  receiver_id: string;
  content: string;
}): Promise<Message> => {
  const response = await api.post<Message>('/messages', data, { headers: getAuthHeaders() });
  return response.data;
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  await api.put(`/messages/${messageId}/read`, {}, { headers: getAuthHeaders() });
};

export const getUnreadCount = async (): Promise<number> => {
  const response = await api.get<{ unread_count: number }>('/messages/unread-count', { headers: getAuthHeaders() });
  return response.data.unread_count;
};