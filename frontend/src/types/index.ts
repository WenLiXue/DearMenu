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
