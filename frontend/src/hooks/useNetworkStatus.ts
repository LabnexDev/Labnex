import { useState, useEffect } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    effectiveType: 'unknown',
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setNetworkStatus({
        isOnline: navigator.onLine,
        isSlowConnection: connection ? (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') : false,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
      });

      // Log network changes in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Network status changed:', {
          isOnline: navigator.onLine,
          connectionType: connection?.type,
          effectiveType: connection?.effectiveType,
        });
      }
    };

    const handleOnline = () => {
      updateNetworkStatus();
      
      // Show user feedback when back online
      if (process.env.NODE_ENV === 'development') {
        console.log('Back online');
      }
    };

    const handleOffline = () => {
      updateNetworkStatus();
      
      // Show user feedback when offline
      if (process.env.NODE_ENV === 'development') {
        console.log('Gone offline');
      }
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Initial status
    updateNetworkStatus();

    // Event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change events (if supported)
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkStatus;
};

export default useNetworkStatus; 