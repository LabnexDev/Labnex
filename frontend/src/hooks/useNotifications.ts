import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../api/axios';
import { toast } from 'react-hot-toast';

export interface Notification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await axiosInstance.get<{ notifications: Notification[] }>('/notifications');
      return response.data.notifications;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await axiosInstance.put<{ notification: Notification }>(`/notifications/${notificationId}/read`);
      return response.data.notification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification marked as read');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to mark notification as read');
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      await axiosInstance.delete(`/notifications/${notificationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Notification deleted');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    },
  });

  return {
    notifications,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
  };
} 