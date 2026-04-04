import axios from 'axios';
import type { Category, Dish, Favorite, HistoryRecord, AuthResponse } from '../types';

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

// Auth
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', {
    username,
    password,
  });
  return response.data;
};

export const register = async (
  username: string,
  password: string,
  role?: 'wife' | 'husband' | 'admin',
  familyName?: string,
  inviteCode?: string
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/register', {
    username,
    password,
    role,
    family_name: familyName,
    invite_code: inviteCode,
  });
  return response.data;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/categories', { headers: getAuthHeaders() });
  return response.data;
};

export const createCategory = async (data: { name: string; description?: string }): Promise<Category> => {
  const response = await api.post<Category>('/categories', data, { headers: getAuthHeaders() });
  return response.data;
};

export const updateCategory = async (id: number, data: { name: string; description?: string }): Promise<Category> => {
  const response = await api.put<Category>(`/categories/${id}`, data, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}`, { headers: getAuthHeaders() });
};

// Dishes
export const getDishes = async (categoryId?: number): Promise<Dish[]> => {
  const params = categoryId ? { category_id: categoryId } : {};
  const response = await api.get<Dish[]>('/dishes', { headers: getAuthHeaders(), params });
  return response.data;
};

export const createDish = async (data: { name: string; category_id?: string; tags?: string[]; rating?: number }): Promise<Dish> => {
  const response = await api.post<Dish>('/dishes', data, { headers: getAuthHeaders() });
  return response.data;
};

export const updateDish = async (id: number, data: { name?: string; category_id?: string; tags?: string[]; rating?: number }): Promise<Dish> => {
  const response = await api.put<Dish>(`/dishes/${id}`, data, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteDish = async (id: number): Promise<void> => {
  await api.delete(`/dishes/${id}`, { headers: getAuthHeaders() });
};

// Favorites
export const getFavorites = async (): Promise<Favorite[]> => {
  const response = await api.get<Favorite[]>('/favorites', { headers: getAuthHeaders() });
  return response.data;
};

export const addFavorite = async (dishId: number): Promise<Favorite> => {
  const response = await api.post<Favorite>(`/favorites/${dishId}`, {}, { headers: getAuthHeaders() });
  return response.data;
};

export const removeFavorite = async (dishId: number): Promise<void> => {
  await api.delete(`/favorites/${dishId}`, { headers: getAuthHeaders() });
};

// History
export const getHistory = async (): Promise<HistoryRecord[]> => {
  const response = await api.get<HistoryRecord[]>('/history', { headers: getAuthHeaders() });
  return response.data;
};

// Random
export const getRandomDish = async (): Promise<Dish> => {
  const response = await api.get<Dish>('/random', { headers: getAuthHeaders() });
  return response.data;
};

export default api;
