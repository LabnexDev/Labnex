import React from 'react';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface OfflineBannerProps {
  className?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ className = '' }) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  const getBannerContent = () => {
    if (!isOnline) {
      return {
        icon: <SignalSlashIcon className="h-5 w-5" />,
        message: 'No internet connection',
        description: 'Some features may not work properly while offline.',
        bgColor: 'bg-red-600',
        textColor: 'text-red-50',
      };
    }

    if (isSlowConnection) {
      return {
        icon: <WifiIcon className="h-5 w-5" />,
        message: 'Slow connection detected',
        description: 'Content may load slower than usual.',
        bgColor: 'bg-amber-600',
        textColor: 'text-amber-50',
      };
    }

    return null;
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div
      className={`${content.bgColor} ${content.textColor} px-4 py-3 border-b border-opacity-20 ${className}`}
      role="banner"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          {content.icon}
          <div className="text-sm">
            <span className="font-medium">{content.message}</span>
            <span className="hidden sm:inline ml-2 opacity-90">
              {content.description}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook to show toast notifications on network changes
export const useNetworkNotifications = () => {
  const { isOnline } = useNetworkStatus();
  const [wasOffline, setWasOffline] = React.useState(!isOnline);

  React.useEffect(() => {
    if (!isOnline && !wasOffline) {
      setWasOffline(true);
      // Could integrate with toast system here
      if (process.env.NODE_ENV === 'development') {
        console.log('Network: Gone offline');
      }
    } else if (isOnline && wasOffline) {
      setWasOffline(false);
      // Could integrate with toast system here
      if (process.env.NODE_ENV === 'development') {
        console.log('Network: Back online');
      }
    }
  }, [isOnline, wasOffline]);

  return { isOnline, wasOffline };
};

export default OfflineBanner; 