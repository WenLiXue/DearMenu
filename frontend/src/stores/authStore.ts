import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Role } from '../types';
import * as api from '../api';
import { getErrorMessage } from '../utils/error';

interface AuthState {
  user: { id: string; username: string; role: Role; familyId: string } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  role: Role | null;
  familyId: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: Role, familyName?: string, inviteCode?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      role: null,
      familyId: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(username, password);
          set({
            user: { id: response.user_id || '', username, role: response.role, familyId: response.family_id },
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            role: response.role,
            familyId: response.family_id,
          });
          localStorage.setItem('token', response.access_token);
          return response;
        } catch (error: any) {
          set({
            error: getErrorMessage(error, '登录失败'),
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (username: string, password: string, role: Role, familyName?: string, inviteCode?: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(username, password, role, familyName, inviteCode);
          set({
            user: { id: response.user_id || '', username, role: response.role, familyId: response.family_id },
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false,
            role: response.role,
            familyId: response.family_id,
          });
          localStorage.setItem('token', response.access_token);
        } catch (error: any) {
          set({
            error: getErrorMessage(error, '注册失败'),
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, role: null, familyId: null });
        localStorage.removeItem('token');
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        familyId: state.familyId,
      }),
    }
  )
);
