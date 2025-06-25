import React, { Suspense, lazy } from 'react';

// Lazy load the heavy markdown components
const LazyLightweightMarkdown = lazy(() => import('./LightweightMarkdown'));
const LazyRemarkGfm = lazy(() => import('remark-gfm'));

interface LazyMarkdownProps {
  children: string;
  className?: string;
  remarkPlugins?: any[];
}

const MarkdownFallback: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-slate-700 rounded mb-2"></div>
    <div className="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
    <div className="h-4 bg-slate-700 rounded mb-2 w-1/2"></div>
  </div>
);

export const LazyMarkdown: React.FC<LazyMarkdownProps> = ({ 
  children, 
  className = '', 
  remarkPlugins = [] 
}) => {
  return (
    <div className={className}>
      <Suspense fallback={<MarkdownFallback />}>
        <LazyLightweightMarkdown 
          remarkPlugins={[...remarkPlugins, LazyRemarkGfm]}
        >
          {children}
        </LazyLightweightMarkdown>
      </Suspense>
    </div>
  );
}; 