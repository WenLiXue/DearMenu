import { create } from 'zustand';
import type { Order, OrderCreate, OrderStatusUpdate } from '../types';
import * as api from '../api';
import { getErrorMessage } from '../utils/error';

interface OrderState {
  orders: Order[];
  pendingOrders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchPendingOrders: () => Promise<void>;
  createOrder: (data: OrderCreate) => Promise<Order>;
  updateOrderStatus: (id: string, data: OrderStatusUpdate) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  notifyOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  pendingOrders: [],
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await api.getOrders();
      set({ orders, isLoading: false });
    } catch (error: any) {
      set({ error: getErrorMessage(error, '获取订单失败'), isLoading: false });
    }
  },

  fetchPendingOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const pendingOrders = await api.getPendingOrders();
      set({ pendingOrders, isLoading: false });
    } catch (error: any) {
      set({ error: getErrorMessage(error, '获取待处理订单失败'), isLoading: false });
    }
  },

  createOrder: async (data: OrderCreate) => {
    set({ isLoading: true, error: null });
    try {
      const order = await api.createOrder(data);
      set((state) => ({
        orders: [order, ...state.orders],
        isLoading: false,
      }));
      return order;
    } catch (error: any) {
      set({ error: getErrorMessage(error, '创建订单失败'), isLoading: false });
      throw error;
    }
  },

  updateOrderStatus: async (id: string, data: OrderStatusUpdate) => {
    set({ isLoading: true, error: null });
    try {
      const updatedOrder = await api.updateOrderStatus(id, data);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        pendingOrders: state.pendingOrders.filter((o) => o.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: getErrorMessage(error, '更新订单状态失败'), isLoading: false });
      throw error;
    }
  },

  cancelOrder: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.cancelOrder(id);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' as const } : o)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: getErrorMessage(error, '取消订单失败'), isLoading: false });
      throw error;
    }
  },

  notifyOrder: async (id: string) => {
    try {
      await api.notifyOrder(id);
    } catch (error: any) {
      set({ error: getErrorMessage(error, '发送提醒失败') });
    }
  },
}));
