import axios from 'axios';

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

// ============ 菜品管理 ============
export interface DishListItem {
  id: string;
  name: string;
  image?: string;
  category_id: string | null;
  tags: string[];
  rating: number;
  is_recommended: boolean;
  description?: string;
  created_at: string;
  category?: {
    id: string;
    name: string;
  };
}

export interface DishFormData {
  name: string;
  image?: File;
  category_id?: string;
  tags: string[];
  is_recommended?: boolean;
  description?: string;
}

export const getDishList = async (params?: {
  search?: string;
  category_id?: string;
  page?: number;
  page_size?: number;
}): Promise<{ list: DishListItem[]; total: number }> => {
  const response = await api.get<{ list: DishListItem[]; total: number }>('/admin/dishes', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const createDish = async (data: DishFormData): Promise<DishListItem> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.image) formData.append('image', data.image);
  if (data.category_id) formData.append('category_id', data.category_id);
  data.tags.forEach(tag => formData.append('tags', tag));
  if (data.is_recommended !== undefined) formData.append('is_recommended', String(data.is_recommended));
  if (data.description) formData.append('description', data.description);

  const response = await api.post<DishListItem>('/admin/dishes', formData, {
    headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateDish = async (id: string, data: DishFormData): Promise<DishListItem> => {
  const formData = new FormData();
  formData.append('name', data.name);
  if (data.image) formData.append('image', data.image);
  if (data.category_id) formData.append('category_id', data.category_id);
  data.tags.forEach(tag => formData.append('tags', tag));
  if (data.is_recommended !== undefined) formData.append('is_recommended', String(data.is_recommended));
  if (data.description) formData.append('description', data.description);

  const response = await api.put<DishListItem>(`/admin/dishes/${id}`, formData, {
    headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteDish = async (id: string): Promise<void> => {
  await api.delete(`/admin/dishes/${id}`, { headers: getAuthHeaders() });
};

// ============ 分类管理 ============
export interface CategoryListItem {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  dish_count: number;
  created_at: string;
}

export const getCategoryList = async (): Promise<CategoryListItem[]> => {
  const response = await api.get<CategoryListItem[]>('/admin/categories', { headers: getAuthHeaders() });
  return response.data;
};

export const createCategory = async (data: { name: string; icon?: string; sort_order?: number }): Promise<CategoryListItem> => {
  const response = await api.post<CategoryListItem>('/admin/categories', data, { headers: getAuthHeaders() });
  return response.data;
};

export const updateCategory = async (id: string, data: { name?: string; icon?: string; sort_order?: number }): Promise<CategoryListItem> => {
  const response = await api.put<CategoryListItem>(`/admin/categories/${id}`, data, { headers: getAuthHeaders() });
  return response.data;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/admin/categories/${id}`, { headers: getAuthHeaders() });
};

// ============ 收藏管理 ============
export interface FavoriteListItem {
  id: string;
  dish: DishListItem;
  is_recommended: boolean;
  created_at: string;
}

export const getFavoriteList = async (): Promise<FavoriteListItem[]> => {
  const response = await api.get<FavoriteListItem[]>('/admin/favorites', { headers: getAuthHeaders() });
  return response.data;
};

export const updateFavoriteRecommend = async (id: string, is_recommended: boolean): Promise<void> => {
  await api.put(`/admin/favorites/${id}`, { is_recommended }, { headers: getAuthHeaders() });
};

// ============ 历史记录 ============
export interface HistoryListItem {
  id: string;
  dish: DishListItem;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export const getHistoryList = async (params?: { page?: number; page_size?: number }): Promise<{ list: HistoryListItem[]; total: number }> => {
  const response = await api.get<{ list: HistoryListItem[]; total: number }>('/admin/history', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const updateHistoryCompleted = async (id: string, is_completed: boolean): Promise<void> => {
  await api.put(`/admin/history/${id}`, { is_completed }, { headers: getAuthHeaders() });
};

// ============ 仪表盘统计 ============
export interface DashboardStats {
  total_dishes: number;
  total_categories: number;
  total_favorites: number;
  total_history: number;
  recent_history: HistoryListItem[];
}

export interface TrendData {
  date: string;
  count: number;
}

export interface WeeklyStats {
  start_date: string;
  end_date: string;
  daily_stats: {
    date: string;
    orders: number;
    completed: number;
  }[];
  total_orders: number;
  total_completed: number;
  completion_rate: number;
}

export interface MonthlyStats {
  start_date: string;
  end_date: string;
  total_orders: number;
  total_completed: number;
  completion_rate: number;
  trend: TrendData[];
  top_categories: { name: string; count: number }[];
  top_dishes: { id: string; name: string; count: number }[];
}

export interface TopDish {
  id: string;
  name: string;
  category_name: string | null;
  count: number;
  rating: number;
}

export interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  dish_count: number;
  order_count: number;
  favorite_count: number;
}

// 增强的仪表盘统计
export interface EnhancedDashboardStats {
  total_dishes: number;
  total_categories: number;
  total_favorites: number;
  total_history: number;
  today_orders: number;
  today_completed: number;
  today_recommendations: number;
  week_total: number;
  week_completed: number;
  weekly_trend: TrendData[];
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStats>('/admin/dashboard', { headers: getAuthHeaders() });
  return response.data;
};

export const getEnhancedDashboardStats = async (): Promise<EnhancedDashboardStats> => {
  const response = await api.get<EnhancedDashboardStats>('/stats/dashboard', { headers: getAuthHeaders() });
  return response.data;
};

export const getWeeklyStats = async (): Promise<WeeklyStats> => {
  const response = await api.get<WeeklyStats>('/stats/weekly', { headers: getAuthHeaders() });
  return response.data;
};

export const getMonthlyStats = async (): Promise<MonthlyStats> => {
  const response = await api.get<MonthlyStats>('/stats/monthly', { headers: getAuthHeaders() });
  return response.data;
};

export const getTopDishes = async (limit: number = 5): Promise<{ dishes: TopDish[]; total: number }> => {
  const response = await api.get<{ dishes: TopDish[]; total: number }>('/stats/top-dishes', {
    headers: getAuthHeaders(),
    params: { limit },
  });
  return response.data;
};

export const getCategoryAnalysis = async (): Promise<{ categories: CategoryStat[]; total: number }> => {
  const response = await api.get<{ categories: CategoryStat[]; total: number }>('/stats/category-analysis', {
    headers: getAuthHeaders(),
  });
  return response.data;
};

export default api;
