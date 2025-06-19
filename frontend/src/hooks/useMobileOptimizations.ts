import { useEffect, useState, useCallback } from 'react';

interface MobileOptimizations {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  supportsHaptics: boolean;
  reducedMotion: boolean;
  deviceMemory: number | undefined;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  optimizedAnimations: boolean;
}

export const useMobileOptimizations = (): MobileOptimizations => {
  const [optimizations, setOptimizations] = useState<MobileOptimizations>({
    isMobile: false,
    isIOS: false,
    isAndroid: false,
    supportsHaptics: false,
    reducedMotion: false,
    deviceMemory: undefined,
    connectionSpeed: 'unknown',
    optimizedAnimations: false,
  });

  const detectOptimizations = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isIOS = /ipad|iphone|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    // Check for haptic support
    const supportsHaptics = 'vibrate' in navigator;
    
    // Check for reduced motion preference
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Get device memory if available (Chrome only)
    const deviceMemory = (navigator as any).deviceMemory;
    
    // Estimate connection speed
    let connectionSpeed: 'slow' | 'fast' | 'unknown' = 'unknown';
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection.effectiveType) {
        connectionSpeed = ['slow-2g', '2g', '3g'].includes(connection.effectiveType) ? 'slow' : 'fast';
      }
    }
    
    // Determine if we should use optimized animations
    const optimizedAnimations = !reducedMotion && !(['slow-2g', '2g'].includes((navigator as any).connection?.effectiveType));
    
    setOptimizations({
      isMobile,
      isIOS,
      isAndroid,
      supportsHaptics,
      reducedMotion,
      deviceMemory,
      connectionSpeed,
      optimizedAnimations,
    });
  }, []);

  useEffect(() => {
    detectOptimizations();
    
    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', detectOptimizations);
      
      return () => {
        connection.removeEventListener('change', detectOptimizations);
      };
    }
  }, [detectOptimizations]);

  return optimizations;
};

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator && navigator.vibrate) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30],
    };
    navigator.vibrate(patterns[type]);
  }
};

export const isLowEndDevice = (): boolean => {
  const deviceMemory = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency;
  
  // Consider it low-end if:
  // - Device memory is 2GB or less
  // - CPU cores are 2 or fewer
  // - Slow connection
  return (
    (deviceMemory && deviceMemory <= 2) ||
    (hardwareConcurrency && hardwareConcurrency <= 2) ||
    (['slow-2g', '2g'].includes((navigator as any).connection?.effectiveType))
  );
};

export default useMobileOptimizations; 