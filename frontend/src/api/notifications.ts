import axios from './axios';

export interface Sender {
  _id: string;
  name: string;
  email?: string;
}

export interface ProjectInNotification {
  _id: string;
  name: string;
}

export enum NotificationType {
  PROJECT_INVITE = 'PROJECT_INVITE',
  PROJECT_INVITE_SENT = 'PROJECT_INVITE_SENT', // Assuming this might exist based on controller
  TEST_CASE_ASSIGNED = 'TEST_CASE_ASSIGNED',
  STATUS_UPDATE = 'STATUS_UPDATE',
  MENTION = 'MENTION',
  GENERAL = 'GENERAL',
  INVITE_ACCEPTED = 'INVITE_ACCEPTED',
  INVITE_REJECTED = 'INVITE_REJECTED',
  TASK_ASSIGNED = 'TASK_ASSIGNED', // Added for task assignment notifications
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  READ = 'READ',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED', // Or whatever other statuses are used
}

export interface Notification {
  _id: string;
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  projectId?: ProjectInNotification;
  senderId?: Sender;
  testCaseId?: string; // If applicable
  createdAt: string;
  updatedAt: string;
}

// Fetch all notifications for the current user
export const getNotifications = async (): Promise<Notification[]> => {
  const { data } = await axios.get<Notification[]>('/notifications');
  return data;
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<{ message: string }> => {
  const { data } = await axios.put<{ message: string }>(`/notifications/${notificationId}/read`);
  return data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (): Promise<{ message: string }> => {
  const { data } = await axios.put<{ message: string }>('/notifications/read-all');
  return data;
};

// Accept a project invite
export const acceptProjectInvite = async (notificationId: string): Promise<{ message: string }> => {
  const { data } = await axios.put<{ message: string }>(`/notifications/${notificationId}/accept`);
  return data;
};

// Reject a project invite
export const rejectProjectInvite = async (notificationId: string): Promise<{ message: string }> => {
  const { data } = await axios.put<{ message: string }>(`/notifications/${notificationId}/reject`);
  return data;
};

// Note: Delete notification function is missing as the backend endpoint does not yet exist.
// Once added, it would look something like this:
export const deleteNotification = async (notificationId: string): Promise<{ message: string }> => {
  const { data } = await axios.delete<{ message: string }>(`/notifications/${notificationId}`);
  return data;
}; 