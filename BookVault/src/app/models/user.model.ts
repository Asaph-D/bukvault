export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  initials?: string;
  role: 'user' | 'author' | 'admin';
  memberSince: Date;
  subscriptionPlan?: 'basic' | 'professional' | 'enterprise';
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'update' | 'payment' | 'comment' | 'sale';
  isRead: boolean;
  date: Date;
  link?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  commission: number;
  maxBooks: number;
  features: {
    name: string;
    included: boolean;
  }[];
  isPopular?: boolean;
}