import axios from 'axios';
import type { Dish } from '../types';

const API_BASE = 'http://localhost:8000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface HusbandTask {
  id: string;
  dish: Dish;
  status: 'pending' | 'cooking' | 'completed';
  started_at?: string;
  completed_at?: string;
}

export const getTodayTasks = async (): Promise<HusbandTask[]> => {
  const response = await api.get<{ code: number; message: string; data: HusbandTask[]; total: number }>('/husband/tasks', { headers: getAuthHeaders() });
  return response.data.data;
};

export const getHusbandHistory = async (): Promise<HusbandTask[]> => {
  const response = await api.get<{ code: number; message: string; data: HusbandTask[]; total: number }>('/husband/history', { headers: getAuthHeaders() });
  return response.data.data;
};

export const updateTaskStatus = async (taskId: string, status: 'pending' | 'cooking' | 'completed'): Promise<void> => {
  await api.put(`/husband/tasks/${taskId}/status`, { status }, { headers: getAuthHeaders() });
};

export const randomCook = async (): Promise<void> => {
  await api.post('/husband/random-cook', {}, { headers: getAuthHeaders() });
};

export const cookFavorite = async (): Promise<void> => {
  await api.post('/husband/cook-favorite', {}, { headers: getAuthHeaders() });
};

export const beLazy = async (): Promise<void> => {
  await api.post('/husband/be-lazy', {}, { headers: getAuthHeaders() });
};

export const sendCompletionMessage = async (taskId: string): Promise<void> => {
  await api.post(`/husband/tasks/${taskId}/notify`, {}, { headers: getAuthHeaders() });
};
