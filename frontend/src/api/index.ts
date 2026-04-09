import axios, { AxiosResponse, AxiosError } from 'axios';
import type { Category, Dish, Favorite, HistoryRecord, AuthResponse, Order, OrderCreate, OrderStatusUpdate } from '../types';

const API_BASE = 'http://localhost:8000/api';

// 统一API响应格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  total?: number;
  page?: number;
  page_size?: number;
}

// API错误
export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

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

// 响应拦截器 - 处理统一响应格式
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const { code, message } = response.data;
    // 2xx 状态码都视为成功（包括 200, 201, 204 等）
    if (code < 200 || code >= 300) {
      throw new ApiError(code, message || '请求失败');
    }
    // 返回完整响应数据（包括 data, total, page 等）
    return response.data;
  },
  (error: AxiosError<ApiResponse<any>>) => {
    if (error.response) {
      const { code, message } = error.response.data || {};
      if (code < 200 || code >= 300) {
        throw new ApiError(code || error.response.status, message || '请求失败');
      }
    }
    throw error;
  }
);

// Auth
export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', {
    username,
    password,
  });
  return response.data as unknown as AuthResponse;
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
  return response as unknown as AuthResponse;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<ApiResponse<Category[]>>('/categories', { headers: getAuthHeaders() });
  return response.data as unknown as Category[];
};

export const createCategory = async (data: { name: string; description?: string }): Promise<Category> => {
  const response = await api.post<ApiResponse<Category>>('/categories', data, { headers: getAuthHeaders() });
  return response.data as unknown as Category;
};

export const updateCategory = async (id: number, data: { name: string; description?: string }): Promise<Category> => {
  const response = await api.put<ApiResponse<Category>>(`/categories/${id}`, data, { headers: getAuthHeaders() });
  return response.data as unknown as Category;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}`, { headers: getAuthHeaders() });
};

// Dishes
export const getDishes = async (categoryId?: string, page: number = 1, pageSize: number = 20): Promise<{ dishes: Dish[], total: number }> => {
  const params: Record<string, any> = { page, page_size: pageSize };
  if (categoryId) params.category_id = categoryId;
  const res = await api.get<ApiResponse<Dish[]>>('/dishes', { headers: getAuthHeaders(), params });
  return { dishes: res.data as unknown as Dish[], total: res.total || 0 };
};

export const createDish = async (data: { name: string; category_id?: string; tags?: string[]; rating?: number }): Promise<Dish> => {
  const response = await api.post<ApiResponse<Dish>>('/dishes', data, { headers: getAuthHeaders() });
  return response.data as unknown as Dish;
};

export const updateDish = async (id: number, data: { name?: string; category_id?: string; tags?: string[]; rating?: number }): Promise<Dish> => {
  const response = await api.put<ApiResponse<Dish>>(`/dishes/${id}`, data, { headers: getAuthHeaders() });
  return response.data as unknown as Dish;
};

export const deleteDish = async (id: number): Promise<void> => {
  await api.delete(`/dishes/${id}`, { headers: getAuthHeaders() });
};

// Favorites
export const getFavorites = async (page: number = 1, pageSize: number = 20): Promise<{ dishes: Dish[], total: number }> => {
  const res = await api.get<ApiResponse<Dish[]>>('/favorites', { headers: getAuthHeaders(), params: { page, page_size: pageSize } });
  return { dishes: res.data as unknown as Dish[], total: res.total || 0 };
};

export const addFavorite = async (dishId: string): Promise<Favorite> => {
  const response = await api.post<ApiResponse<Favorite>>(`/favorites/${dishId}`, {}, { headers: getAuthHeaders() });
  return response.data as unknown as Favorite;
};

export const removeFavorite = async (dishId: string): Promise<void> => {
  await api.delete(`/favorites/${dishId}`, { headers: getAuthHeaders() });
};

// History
export const getHistory = async (): Promise<HistoryRecord[]> => {
  const response = await api.get<ApiResponse<HistoryRecord[]>>('/history', { headers: getAuthHeaders() });
  return response.data as unknown as HistoryRecord[];
};

// Random
export const getRandomDish = async (): Promise<Dish> => {
  const response = await api.get<ApiResponse<Dish>>('/random', { headers: getAuthHeaders() });
  return response.data as unknown as Dish;
};

// Orders
export const createOrder = async (data: OrderCreate): Promise<Order> => {
  // Single dish: transform {dish_id} to {items: [{dish_id}]} for backend API
  const payload = { items: [{ dish_id: data.dish_id }] };
  const response = await api.post<ApiResponse<Order>>('/orders', payload, { headers: getAuthHeaders() });
  return response.data as unknown as Order;
};

export const createBatchOrders = async (dishIds: string[], notes?: string): Promise<Order> => {
  // Batch order: send all dish_ids in one request, backend returns single order with multiple items
  const payload = { items: dishIds.map(dish_id => ({ dish_id })), notes };
  const response = await api.post<ApiResponse<Order>>('/orders', payload, { headers: getAuthHeaders() });
  return response.data as unknown as Order;
};

export const getOrders = async (): Promise<Order[]> => {
  const response = await api.get<ApiResponse<Order[]>>('/orders', { headers: getAuthHeaders() });
  return response.data as unknown as Order[];
};

export const getOrder = async (id: string): Promise<Order> => {
  const response = await api.get<ApiResponse<Order>>(`/orders/${id}`, { headers: getAuthHeaders() });
  return response.data as unknown as Order;
};

export const updateOrderStatus = async (id: string, data: OrderStatusUpdate): Promise<Order> => {
  const response = await api.patch<ApiResponse<Order>>(`/orders/${id}/status`, data, { headers: getAuthHeaders() });
  return response.data as unknown as Order;
};

export const cancelOrder = async (id: string): Promise<void> => {
  await api.post(`/orders/${id}/cancel`, {}, { headers: getAuthHeaders() });
};

export const getPendingOrders = async (): Promise<Order[]> => {
  const response = await api.get<ApiResponse<Order[]>>('/orders/pending', { headers: getAuthHeaders() });
  return response.data as unknown as Order[];
};

export const notifyOrder = async (id: string): Promise<void> => {
  await api.post(`/orders/${id}/notify`, {}, { headers: getAuthHeaders() });
};

// 家庭
export const generateInviteCode = async (): Promise<{ invite_code: string }> => {
  const response = await api.post<ApiResponse<{ invite_code: string }>>('/families/generate-code', {}, { headers: getAuthHeaders() });
  return response.data as unknown as { invite_code: string };
};

export default api;
