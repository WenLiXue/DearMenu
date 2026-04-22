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

// 响应拦截器：处理统一响应格式 {code, message, data}
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 如果是统一响应格式，解包 data
    if (res && typeof res === 'object' && 'code' in res && 'data' in res) {
      if (res.code !== 200 && res.code !== 201) {
        return Promise.reject(new Error(res.message || '请求失败'));
      }
      response.data = res.data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============ 菜品管理 ============
export interface DishListItem {
  id: string;
  name: string;
  image?: string;
  image_url?: string;
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
  image_url?: string;
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
}): Promise<{ items: DishListItem[]; total: number }> => {
  const response = await api.get<{ items: DishListItem[]; total: number }>('/admin/dishes', {
    headers: getAuthHeaders(),
    params,
  });
  return response.data;
};

export const createDish = async (data: DishFormData): Promise<DishListItem> => {
  const response = await api.post<DishListItem>('/admin/dishes', {
    name: data.name,
    category_id: data.category_id,
    tags: data.tags,
    is_recommended: data.is_recommended,
    description: data.description,
    image_url: data.image_url,
  }, {
    headers: { ...getAuthHeaders() },
  });
  return response.data;
};

export const updateDish = async (id: string, data: DishFormData): Promise<DishListItem> => {
  const response = await api.put<DishListItem>(`/admin/dishes/${id}`, {
    name: data.name,
    category_id: data.category_id,
    tags: data.tags,
    is_recommended: data.is_recommended,
    description: data.description,
    image_url: data.image_url,
  }, {
    headers: { ...getAuthHeaders() },
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
  dish_id: string;
  dish_name: string;
  dish_rating: number;
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
  status: string;
  dish_names: string;
  dish_count: number;
  created_at: string;
  completed_at?: string;
}

export const getHistoryList = async (params?: { page?: number; page_size?: number }): Promise<{ items: HistoryListItem[]; total: number }> => {
  const response = await api.get<{ items: HistoryListItem[]; total: number }>('/admin/history', {
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
  recent_history: {
    id: string;
    dish_names: string;
    dish_count: number;
    created_at: string;
  }[];
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
  const response = await api.get<DashboardStats>('/admin/stats', { headers: getAuthHeaders() });
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
