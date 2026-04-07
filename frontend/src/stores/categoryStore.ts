import { create } from 'zustand';
import type { Category } from '../types';
import * as api from '../api';
import { getErrorMessage } from '../utils/error';

interface CategoryState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  addCategory: (name: string, description?: string) => Promise<void>;
  updateCategory: (id: number, name: string, description?: string) => Promise<void>;
  removeCategory: (id: number) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await api.getCategories();
      set({ categories, isLoading: false });
    } catch (error: any) {
      set({ error: getErrorMessage(error, '获取分类失败'), isLoading: false });
    }
  },

  addCategory: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const category = await api.createCategory({ name, description });
      set((state) => ({
        categories: [...state.categories, category],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: getErrorMessage(error, '创建分类失败'), isLoading: false });
      throw error;
    }
  },

  updateCategory: async (id: number, name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const category = await api.updateCategory(id, { name, description });
      set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? category : c)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: getErrorMessage(error, '更新分类失败'), isLoading: false });
      throw error;
    }
  },

  removeCategory: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteCategory(id);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: getErrorMessage(error, '删除分类失败'), isLoading: false });
      throw error;
    }
  },
}));
