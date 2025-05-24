import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, acceptProjectInvite, rejectProjectInvite, deleteNotification, type Notification, NotificationStatus, NotificationType } from '../../api/notifications';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { toast } from 'react-hot-toast';
import { CheckIcon, EyeIcon, InboxArrowDownIcon, TrashIcon, XMarkIcon, InformationCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case NotificationType.PROJECT_INVITE:
      return <InboxArrowDownIcon className="h-6 w-6 text-blue-400" />;
    case NotificationType.TASK_ASSIGNED:
      return <ClipboardDocumentListIcon className="h-6 w-6 text-green-400" />;
    // Add more cases for other notification types if needed
    default:
      return <InformationCircleIcon className="h-6 w-6 text-slate-400" />;
  }
};

const NotificationCard: React.FC<{ notification: Notification; onMarkAsRead: (id: string) => void; onAcceptInvite: (id: string) => void; onRejectInvite: (id: string) => void; onDelete: (id: string) => void; }> = 
  ({ notification, onMarkAsRead, onAcceptInvite, onRejectInvite, onDelete }) => {
  
  const handleAccept = () => onAcceptInvite(notification._id);
  const handleReject = () => onRejectInvite(notification._id);
  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      onDelete(notification._id);
    }
  };

  return (
    <div className={`card p-4 sm:p-5 shadow-lg transition-all duration-300 hover:shadow-xl ${notification.status === NotificationStatus.PENDING || notification.status !== NotificationStatus.READ ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700/50 opacity-70'}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-grow">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notification.message}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(notification.createdAt).toLocaleString()} 
            {notification.senderId && ` - From: ${notification.senderId.name}`}
          </p>
          {notification.projectId && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Project: <Link 
                to={notification.type === NotificationType.TASK_ASSIGNED 
                    ? `/projects/${notification.projectId._id}/tasks` 
                    : `/projects/${notification.projectId._id}`}
                className="text-blue-500 hover:underline dark:text-blue-400"
              >
                {notification.projectId.name}
              </Link>
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-2 ml-2">
          {notification.status === NotificationStatus.PENDING && notification.type === NotificationType.PROJECT_INVITE && (
            <>
              <Button size="sm" variant="primary" onClick={handleAccept} leftIcon={<CheckIcon className="h-4 w-4" />}>Accept</Button>
              <Button size="sm" variant="danger" onClick={handleReject} leftIcon={<XMarkIcon className="h-4 w-4" />}>Reject</Button>
            </>
          )}
          {notification.status !== NotificationStatus.READ && notification.type !== NotificationType.PROJECT_INVITE && (
            <Button size="sm" variant="secondary" onClick={() => onMarkAsRead(notification._id)} title="Mark as Read" leftIcon={<EyeIcon className="h-4 w-4" />}>
              Mark Read
            </Button>
          )}
          <Button size="sm" variant="tertiary" onClick={handleDelete} title="Delete Notification" leftIcon={<TrashIcon className="h-4 w-4 text-red-500 dark:text-red-400" />}>
            <>{/* Empty children for icon-only button */}</>
          </Button>
        </div>
      </div>
    </div>
  );
};

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [activeTab] = useState('all');

  const { data: notifications, isLoading, error } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      toast.success('Notification marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userContext'] }); // For unread count in header
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
    onError: () => toast.error('Failed to mark notification as read.'),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      toast.success('All notifications marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userContext'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
    onError: () => toast.error('Failed to mark all notifications as read.'),
  });

  const acceptInviteMutation = useMutation({
    mutationFn: acceptProjectInvite,
    onSuccess: () => {
      toast.success('Project invite accepted!');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] }); // To refresh project list if user is added
      queryClient.invalidateQueries({ queryKey: ['userContext'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to accept invite.'),
  });

  const rejectInviteMutation = useMutation({
    mutationFn: rejectProjectInvite,
    onSuccess: () => {
      toast.success('Project invite rejected.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userContext'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reject invite.'),
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      toast.success('Notification deleted.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['userContext'] }); // Update unread count if applicable
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unreadCount'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete notification.'),
  });

  const filteredNotifications = notifications?.filter(n => {
    if (activeTab === 'unread') return n.status === NotificationStatus.PENDING || n.status !== NotificationStatus.READ;
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications?.filter(n => n.status === NotificationStatus.PENDING || n.status !== NotificationStatus.READ).length || 0;

  if (isLoading) return <div className="flex justify-center items-center h-96"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="text-center card p-8 text-red-500">Error fetching notifications: {error.message}</div>;

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        {notifications && notifications.length > 0 && unreadCount > 0 && (
          <Button 
            variant="primary"
            onClick={() => markAllAsReadMutation.mutate()}
            isLoading={markAllAsReadMutation.isPending}
            leftIcon={<CheckIcon className="h-5 w-5" />}
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter buttons could go here if desired */}
      {/* <div className="mb-4 flex gap-2">
        <Button variant={filter === 'all' ? 'solid' : 'outline'} onClick={() => setFilter('all')}>All</Button>
        <Button variant={filter === 'unread' ? 'solid' : 'outline'} onClick={() => setFilter('unread')}>Unread</Button>
      </div> */}

      {filteredNotifications && filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <NotificationCard 
              key={notification._id} 
              notification={notification} 
              onMarkAsRead={markAsReadMutation.mutate}
              onAcceptInvite={acceptInviteMutation.mutate}
              onRejectInvite={rejectInviteMutation.mutate}
              onDelete={deleteNotificationMutation.mutate}
            />
          ))}
        </div>
      ) : (
        <div className="card text-center p-12">
          <InformationCircleIcon className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">No Notifications</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {activeTab === 'unread' ? 'You have no unread notifications.' : 'You currently have no notifications.'}
          </p>
        </div>
      )}
    </div>
  );
} 