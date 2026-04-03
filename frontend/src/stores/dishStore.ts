import { create } from 'zustand';
import type { Dish, Favorite, HistoryRecord } from '../types';
import * as api from '../api';

interface DishState {
  dishes: Dish[];
  favorites: Favorite[];
  history: HistoryRecord[];
  randomDish: Dish | null;
  isLoading: boolean;
  error: string | null;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  fetchDishes: (categoryId?: string) => Promise<void>;
  fetchFavorites: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchRandomDish: () => Promise<void>;
  addDish: (formData: FormData) => Promise<void>;
  updateDish: (id: string, formData: FormData) => Promise<void>;
  removeDish: (id: string) => Promise<void>;
  addFavorite: (dishId: string) => Promise<void>;
  removeFavorite: (dishId: string) => Promise<void>;
}

export const useDishStore = create<DishState>((set, get) => ({
  dishes: [],
  favorites: [],
  history: [],
  randomDish: null,
  isLoading: false,
  error: null,
  selectedCategoryId: null,

  setSelectedCategoryId: (id) => set({ selectedCategoryId: id }),

  fetchDishes: async (categoryId?: number) => {
    set({ isLoading: true, error: null });
    try {
      const dishes = await api.getDishes(categoryId);
      set({ dishes, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '获取菜品失败', isLoading: false });
    }
  },

  fetchFavorites: async () => {
    set({ isLoading: true, error: null });
    try {
      const favorites = await api.getFavorites();
      set({ favorites, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '获取收藏失败', isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await api.getHistory();
      set({ history, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '获取历史失败', isLoading: false });
    }
  },

  fetchRandomDish: async () => {
    set({ isLoading: true, error: null });
    try {
      const randomDish = await api.getRandomDish();
      set({ randomDish, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '获取随机推荐失败', isLoading: false });
    }
  },

  addDish: async (formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const dish = await api.createDish(formData);
      set((state) => ({
        dishes: [...state.dishes, dish],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '创建菜品失败', isLoading: false });
      throw error;
    }
  },

  updateDish: async (id: number, formData: FormData) => {
    set({ isLoading: true, error: null });
    try {
      const dish = await api.updateDish(id, formData);
      set((state) => ({
        dishes: state.dishes.map((d) => (d.id === id ? dish : d)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '更新菜品失败', isLoading: false });
      throw error;
    }
  },

  removeDish: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteDish(id);
      set((state) => ({
        dishes: state.dishes.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '删除菜品失败', isLoading: false });
      throw error;
    }
  },

  addFavorite: async (dishId: number) => {
    set({ isLoading: true, error: null });
    try {
      const favorite = await api.addFavorite(dishId);
      set((state) => ({
        favorites: [...state.favorites, favorite],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '添加收藏失败', isLoading: false });
      throw error;
    }
  },

  removeFavorite: async (dishId: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.removeFavorite(dishId);
      set((state) => ({
        favorites: state.favorites.filter((f) => f.dish_id !== dishId),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '取消收藏失败', isLoading: false });
      throw error;
    }
  },
}));
