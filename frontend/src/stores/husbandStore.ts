import { create } from 'zustand';
import type { Dish } from '../types';
import * as api from '../api/husband';

export type TaskStatus = 'pending' | 'cooking' | 'completed';

export interface HusbandTask {
  id: string;
  dish: Dish;
  status: TaskStatus;
  started_at?: string;
  completed_at?: string;
}

interface HusbandState {
  tasks: HusbandTask[];
  history: HusbandTask[];
  isLoading: boolean;
  error: string | null;
  fetchTasks: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  startCooking: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  randomCook: () => Promise<void>;
  cookFavorite: () => Promise<void>;
  beLazy: () => Promise<void>;
}

export const useHusbandStore = create<HusbandState>((set, get) => ({
  tasks: [],
  history: [],
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await api.getTodayTasks();
      set({ tasks, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '获取任务失败', isLoading: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoading: true, error: null });
    try {
      const history = await api.getHusbandHistory();
      set({ history, isLoading: false });
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '获取历史失败', isLoading: false });
    }
  },

  startCooking: async (taskId: string) => {
    try {
      await api.updateTaskStatus(taskId, 'cooking');
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: 'cooking', started_at: new Date().toISOString() } : t
        ),
      }));
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '更新状态失败' });
    }
  },

  completeTask: async (taskId: string) => {
    try {
      await api.updateTaskStatus(taskId, 'completed');
      // 重新获取任务列表，确保显示同订单的其他待制作菜品
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '更新状态失败' });
    }
  },

  randomCook: async () => {
    try {
      await api.randomCook();
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '操作失败' });
    }
  },

  cookFavorite: async () => {
    try {
      await api.cookFavorite();
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '操作失败' });
    }
  },

  beLazy: async () => {
    try {
      await api.beLazy();
      await get().fetchTasks();
    } catch (error: any) {
      set({ error: error.response?.data?.detail || '操作失败' });
    }
  },
}));
