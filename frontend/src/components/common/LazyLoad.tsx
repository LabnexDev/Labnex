import React, { Suspense, lazy } from 'react';
import type { ComponentType } from 'react';

interface LazyLoadProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const LazyLoad: React.FC<LazyLoadProps> = ({ 
  component, 
  fallback = <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-32" />,
  ...props 
}) => {
  const LazyComponent = lazy(component);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyLoad; 