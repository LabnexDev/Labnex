import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import { BellIcon, ArrowLeftOnRectangleIcon, InformationCircleIcon, UserGroupIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
// import { useTheme } from '../../contexts/ThemeContext'; // useTheme and theme are unused
import { useQuery } from '@tanstack/react-query';
import { getNotifications, type Notification, NotificationStatus, NotificationType } from '../../api/notifications';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  // const { theme } = useTheme(); // theme is unused
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Unused state
  // navigate was unused

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ['notifications', 'unreadCount'], // Differentiate from main notifications query
    queryFn: getNotifications,
    enabled: !!user, // Only fetch if user is logged in
    // Consider adding refetchInterval for more real-time feel, e.g., refetchInterval: 60000, // every minute
  });

  const unreadNotifications = notifications?.filter(
    (n) => n.status === NotificationStatus.PENDING || n.status !== NotificationStatus.READ
  ) || [];

  const notificationCount = unreadNotifications.length;
  const recentUnreadNotifications = unreadNotifications.slice(0, 3); // Show top 3 recent unread

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-900 shadow-md dark:border-b dark:border-gray-700/50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://discord.gg/4jPvtrF4"
              target="_blank"
              rel="noopener noreferrer"
              title="Join our Discord server"
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
            >
              <span className="sr-only">Join our Discord server</span>
              <UserGroupIcon className="h-6 w-6" />
            </a>

            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white transition-colors"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
                {notificationCount > 0 && (
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800" />
                )}
              </button>

              {isNotificationsOpen && (
                <div 
                  className="absolute right-0 mt-2 w-80 rounded-md shadow-xl overflow-hidden z-50 
                             bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700/50"
                >
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {recentUnreadNotifications.length > 0 ? (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentUnreadNotifications.map((notification) => (
                          <li key={notification._id} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/60">
                            <Link 
                              to={notification.type === NotificationType.PROJECT_INVITE && notification.projectId ? `/projects/${notification.projectId._id}` : '/notifications'}
                              onClick={() => setIsNotificationsOpen(false)}
                              className="block"
                            >
                              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">{notification.message}</p>
                              <p className="text-xxs text-gray-500 dark:text-gray-400">
                                {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="px-4 py-6 text-center">
                        <InformationCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <Link 
                      to="/notifications" 
                      className="block text-xs text-center text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setIsNotificationsOpen(false)}
                    >
                        View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {user && (
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">Hi, {user.name}</span>
            )}

            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-700/50 hover:text-red-600 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors"
            >
              <span className="sr-only">Logout</span>
              <ArrowLeftOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
} 