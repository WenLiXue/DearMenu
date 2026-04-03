import { create } from 'zustand';
import * as adminApi from '../api/admin';

interface AdminState {
  // 菜品管理
  dishes: adminApi.DishListItem[];
  dishTotal: number;
  dishLoading: boolean;
  dishParams: {
    search?: string;
    category_id?: string;
    page: number;
    page_size: number;
  };
  fetchDishes: () => Promise<void>;
  createDish: (data: adminApi.DishFormData) => Promise<void>;
  updateDish: (id: string, data: adminApi.DishFormData) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;

  // 分类管理
  categories: adminApi.CategoryListItem[];
  categoryLoading: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (data: { name: string; icon?: string; sort_order?: number }) => Promise<void>;
  updateCategory: (id: string, data: { name?: string; icon?: string; sort_order?: number }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // 收藏管理
  favorites: adminApi.FavoriteListItem[];
  favoriteLoading: boolean;
  fetchFavorites: () => Promise<void>;
  updateFavoriteRecommend: (id: string, is_recommended: boolean) => Promise<void>;

  // 历史记录
  history: adminApi.HistoryListItem[];
  historyTotal: number;
  historyLoading: boolean;
  historyParams: {
    page: number;
    page_size: number;
  };
  fetchHistory: () => Promise<void>;
  updateHistoryCompleted: (id: string, is_completed: boolean) => Promise<void>;

  // 仪表盘
  stats: adminApi.DashboardStats | null;
  statsLoading: boolean;
  fetchStats: () => Promise<void>;

  // 增强统计数据
  enhancedStats: adminApi.EnhancedDashboardStats | null;
  weeklyStats: adminApi.WeeklyStats | null;
  monthlyStats: adminApi.MonthlyStats | null;
  topDishes: adminApi.TopDish[];
  categoryStats: adminApi.CategoryStat[];
  statsTab: 'today' | 'weekly' | 'monthly';
  setStatsTab: (tab: 'today' | 'weekly' | 'monthly') => void;
  fetchEnhancedStats: () => Promise<void>;
  fetchWeeklyStats: () => Promise<void>;
  fetchMonthlyStats: () => Promise<void>;
  fetchTopDishes: () => Promise<void>;
  fetchCategoryStats: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // 菜品管理
  dishes: [],
  dishTotal: 0,
  dishLoading: false,
  dishParams: {
    page: 1,
    page_size: 10,
  },

  fetchDishes: async () => {
    set({ dishLoading: true });
    try {
      const params = get().dishParams;
      const result = await adminApi.getDishList(params);
      set({ dishes: result.list, dishTotal: result.total, dishLoading: false });
    } catch {
      set({ dishLoading: false });
    }
  },

  createDish: async (data) => {
    await adminApi.createDish(data);
    await get().fetchDishes();
  },

  updateDish: async (id, data) => {
    await adminApi.updateDish(id, data);
    await get().fetchDishes();
  },

  deleteDish: async (id) => {
    await adminApi.deleteDish(id);
    await get().fetchDishes();
  },

  // 分类管理
  categories: [],
  categoryLoading: false,

  fetchCategories: async () => {
    set({ categoryLoading: true });
    try {
      const result = await adminApi.getCategoryList();
      set({ categories: result, categoryLoading: false });
    } catch {
      set({ categoryLoading: false });
    }
  },

  createCategory: async (data) => {
    await adminApi.createCategory(data);
    await get().fetchCategories();
  },

  updateCategory: async (id, data) => {
    await adminApi.updateCategory(id, data);
    await get().fetchCategories();
  },

  deleteCategory: async (id) => {
    await adminApi.deleteCategory(id);
    await get().fetchCategories();
  },

  // 收藏管理
  favorites: [],
  favoriteLoading: false,

  fetchFavorites: async () => {
    set({ favoriteLoading: true });
    try {
      const result = await adminApi.getFavoriteList();
      set({ favorites: result, favoriteLoading: false });
    } catch {
      set({ favoriteLoading: false });
    }
  },

  updateFavoriteRecommend: async (id, is_recommended) => {
    await adminApi.updateFavoriteRecommend(id, is_recommended);
    await get().fetchFavorites();
  },

  // 历史记录
  history: [],
  historyTotal: 0,
  historyLoading: false,
  historyParams: {
    page: 1,
    page_size: 10,
  },

  fetchHistory: async () => {
    set({ historyLoading: true });
    try {
      const params = get().historyParams;
      const result = await adminApi.getHistoryList(params);
      set({ history: result.list, historyTotal: result.total, historyLoading: false });
    } catch {
      set({ historyLoading: false });
    }
  },

  updateHistoryCompleted: async (id, is_completed) => {
    await adminApi.updateHistoryCompleted(id, is_completed);
    await get().fetchHistory();
  },

  // 仪表盘
  stats: null,
  statsLoading: false,

  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const result = await adminApi.getDashboardStats();
      set({ stats: result, statsLoading: false });
    } catch {
      set({ statsLoading: false });
    }
  },

  // 增强统计数据
  enhancedStats: null,
  weeklyStats: null,
  monthlyStats: null,
  topDishes: [],
  categoryStats: [],
  statsTab: 'today',
  setStatsTab: (tab) => set({ statsTab: tab }),

  fetchEnhancedStats: async () => {
    try {
      const result = await adminApi.getEnhancedDashboardStats();
      set({ enhancedStats: result });
    } catch {
      // ignore error
    }
  },

  fetchWeeklyStats: async () => {
    try {
      const result = await adminApi.getWeeklyStats();
      set({ weeklyStats: result });
    } catch {
      // ignore error
    }
  },

  fetchMonthlyStats: async () => {
    try {
      const result = await adminApi.getMonthlyStats();
      set({ monthlyStats: result });
    } catch {
      // ignore error
    }
  },

  fetchTopDishes: async () => {
    try {
      const result = await adminApi.getTopDishes(5);
      set({ topDishes: result.dishes });
    } catch {
      // ignore error
    }
  },

  fetchCategoryStats: async () => {
    try {
      const result = await adminApi.getCategoryAnalysis();
      set({ categoryStats: result.categories });
    } catch {
      // ignore error
    }
  },
}));
