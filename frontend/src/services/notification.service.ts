import { api } from '@/lib/api';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export enum NotificationType {
  MATCH = 'MATCH',
  TOURNAMENT = 'TOURNAMENT',
  TEAM = 'TEAM',
  PAYMENT = 'PAYMENT',
  WALLET = 'WALLET',
  SCRIM = 'SCRIM',
  TEAM_INVITE = 'TEAM_INVITE',
  TEAM_JOIN = 'TEAM_JOIN',
  MATCH_RESULT = 'MATCH_RESULT',
  TOURNAMENT_START = 'TOURNAMENT_START',
  TRANSACTION = 'TRANSACTION',
  SYSTEM = 'SYSTEM',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
}

export const notificationService = {
  async getAll() {
    return api.get<{ notifications: Notification[]; unreadCount: number }>('/notifications');
  },

  async getUnreadCount() {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.count;
  },

  async markAsRead(id: string) {
    return api.patch<Notification>(`/notifications/${id}/read`);
  },

  async markAllAsRead() {
    return api.patch<{ message: string }>('/notifications/mark-all-read');
  },

  async delete(id: string) {
    return api.delete<{ message: string }>(`/notifications/${id}`);
  },

  async clearRead() {
    return api.delete<{ message: string }>('/notifications/clear/read');
  },
};
