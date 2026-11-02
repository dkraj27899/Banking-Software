import api from './client';
import type { ApiResponse } from '@bccs/shared';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications() {
  const { data } = await api.get<ApiResponse<Notification[]>>('/notifications');
  return data.data ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await api.get<ApiResponse<{ count: number }>>('/notifications/count');
  return data.data?.count ?? 0;
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}
