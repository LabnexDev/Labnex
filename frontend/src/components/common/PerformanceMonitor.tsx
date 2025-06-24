import { useEffect } from 'react';

interface PerformanceMonitorProps {
  onMetrics?: (metrics: PerformanceMetrics) => void;
}

interface PerformanceMetrics {
  fcp: number;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ onMetrics }) => {
  useEffect(() => {
    // Only run in production and if PerformanceObserver is available
    if (process.env.NODE_ENV !== 'production' || !('PerformanceObserver' in window)) {
      return;
    }

    const metrics: Partial<PerformanceMetrics> = {};

    // First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
        checkMetricsComplete();
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        metrics.lcp = lastEntry.startTime;
        checkMetricsComplete();
      }
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fidEntry = entries[0] as PerformanceEventTiming;
      if (fidEntry) {
        metrics.fid = fidEntry.processingStart - fidEntry.startTime;
        checkMetricsComplete();
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      metrics.cls = clsValue;
      checkMetricsComplete();
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      checkMetricsComplete();
    }

    function checkMetricsComplete() {
      if (Object.keys(metrics).length >= 5 && onMetrics) {
        onMetrics(metrics as PerformanceMetrics);
        
        // Clean up observers
        fcpObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      }
    }

    // Cleanup function
    return () => {
      fcpObserver.disconnect();
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, [onMetrics]);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor; 