export interface User {
  id: string;
  username: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Dish {
  id: string;
  name: string;
  category_id: string | null;
  tags: string[];
  rating: number;
  created_at: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface Favorite {
  id: string;
  user_id: string;
  dish_id: string;
  dish?: Dish;
  created_at: string;
}

export interface HistoryRecord {
  id: string;
  user_id: string;
  dish_id: string;
  dish?: Dish;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: 'wife' | 'husband' | 'admin';
  family_id: string;
}

export type Role = 'wife' | 'husband' | 'admin';

export interface Notification {
  id: string;
  user_id: string;
  sender_id?: string;
  type: 'notification' | 'message' | 'task' | 'celebration';
  title: string;
  content?: string;
  is_read: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
}

export interface Conversation {
  user_id: string;
  username: string;
  role: string;
  last_message: Message | null;
  unread_count: number;
}

// 订单状态
export type OrderStatus = 'pending' | 'cooking' | 'completed' | 'cancelled';

// 订单项
export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string;
  status: 'pending' | 'cooking' | 'completed' | 'cancelled';
  notes?: string;
  cooked_at?: string;
  dish?: Dish;
}

// 订单
export interface Order {
  id: string;
  user_id: string;
  family_id: string;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  completed_at?: string;
  items?: OrderItem[];  // 订单包含的菜品项
  dishes?: Dish[];      // 菜品列表（用于兼容）
}

// 创建订单请求
export interface OrderCreate {
  dish_id: string;
  notes?: string;
}

// 更新订单状态请求
export interface OrderStatusUpdate {
  status: OrderStatus;
}
