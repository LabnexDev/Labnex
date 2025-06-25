import React, { Suspense, lazy, ComponentType } from 'react';

interface LazyLoaderProps {
  component: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  [key: string]: any;
}

const LazyLoader: React.FC<LazyLoaderProps> = ({ 
  component, 
  fallback = <div className="flex items-center justify-center p-4">Loading...</div>,
  ...props 
}) => {
  const LazyComponent = lazy(component);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

export default LazyLoader; 