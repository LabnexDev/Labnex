import React, { useRef, useEffect } from 'react';

interface MobileVoiceGesturesProps {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  isActive?: boolean;
}

const MobileVoiceGestures: React.FC<MobileVoiceGesturesProps> = ({
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  children,
  isActive = true,
}) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Haptic feedback helper
  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator && navigator.vibrate) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30],
      };
      navigator.vibrate(patterns[type]);
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (!isActive) return;
    
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        hapticFeedback('medium');
        onLongPress();
      }, 800);
    }
  };

  const handleTouchMove = (_e: TouchEvent) => {
    if (!isActive || !touchStartRef.current) return;
    
    // Cancel long press if user moves finger
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (!isActive || !touchStartRef.current) return;

    // Cancel long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Check for swipe gestures
    if (distance > 50 && deltaTime < 300) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY < -50 && onSwipeUp) {
          hapticFeedback('light');
          onSwipeUp();
        } else if (deltaY > 50 && onSwipeDown) {
          hapticFeedback('light');
          onSwipeDown();
        }
      }
    }
    // Check for double tap
    else if (distance < 20 && deltaTime < 300 && onDoubleTap) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        hapticFeedback('medium');
        onDoubleTap();
      }
      lastTapRef.current = now;
    }

    touchStartRef.current = null;
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isActive, onSwipeUp, onSwipeDown, onDoubleTap, onLongPress]);

  return (
    <div ref={containerRef} className="w-full h-full">
      {children}
    </div>
  );
};

export default MobileVoiceGestures; 