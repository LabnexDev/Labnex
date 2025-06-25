import React, { Suspense, lazy, useState } from 'react';

// Loading components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// Lazy load heavy UI components
export const LazyModal = lazy(() => import('./Modal/Modal').then(module => ({ default: module.Modal })));
export const LazyButton = lazy(() => import('./Button').then(module => ({ default: module.Button })));
export const LazyCard = lazy(() => import('./Card').then(module => ({ default: module.Card })));

// Lazy load heavy form components
export const LazySearchBar = lazy(() => import('./SearchBar/SearchBar').then(module => ({ default: module.SearchBar })));
export const LazyFilter = lazy(() => import('./Filter/Filter').then(module => ({ default: module.Filter })));
export const LazyFilterBar = lazy(() => import('./FilterBar/FilterBar').then(module => ({ default: module.FilterBar })));

// Lazy load heavy visual components
export const LazyErrorMessage = lazy(() => import('./ErrorMessage/ErrorMessage').then(module => ({ default: module.ErrorMessage })));

// Lazy load heavy AI components - using default imports
export const LazyAIChatBubble = lazy(() => import('../ai-chat/AIChatBubble'));
export const LazyAIChatModal = lazy(() => import('../ai-chat/AIChatModal'));
export const LazyAIPreviewPanel = lazy(() => import('../ai-chat/AIPreviewPanel'));

// Lazy load heavy landing components - using default imports
export const LazyAdvancedCodeInterface = lazy(() => import('../landing/AdvancedCodeInterface'));
export const LazyAIHighlights = lazy(() => import('../landing/AIHighlights'));
export const LazyBeforeAfterComparison = lazy(() => import('../landing/BeforeAfterComparison'));

// Lazy load heavy visual components - using default imports
export const LazyAIResponseBox = lazy(() => import('../visual/AIResponseBox'));
export const LazyAIScanningIndicator = lazy(() => import('../visual/AIScanningIndicator'));
export const LazyOrbBackground = lazy(() => import('../visual/OrbBackground'));

// Lazy load heavy voice components - using default imports
export const LazyVoiceRingWaveform = lazy(() => import('../voice/VoiceRingWaveform'));

// Lazy load heavy icon components - using default imports
export const LazyAnimatedGearIcon = lazy(() => import('../icons/gradient/AnimatedGearIcon'));

// Utility hooks for dynamic imports
export const useLazyMarkdown = () => {
  const [MarkdownComponent, setMarkdownComponent] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadMarkdown = async () => {
    if (MarkdownComponent) return MarkdownComponent;
    
    setIsLoading(true);
    try {
      const module = await import('./LightweightMarkdown');
      setMarkdownComponent(() => module.default);
      return module.default;
    } catch (error) {
      console.error('Failed to load markdown:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { MarkdownComponent, isLoading, loadMarkdown };
};

export const useLazySyntaxHighlighter = () => {
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState<React.ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadSyntaxHighlighter = async () => {
    if (SyntaxHighlighter) return SyntaxHighlighter;
    
    setIsLoading(true);
    try {
      const module = await import('react-syntax-highlighter');
      setSyntaxHighlighter(() => module.Prism);
      return module.Prism;
    } catch (error) {
      console.error('Failed to load syntax highlighter:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { SyntaxHighlighter, isLoading, loadSyntaxHighlighter };
};

export const useLazyFramerMotion = () => {
  const [motion, setMotion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadFramerMotion = async () => {
    if (motion) return motion;
    
    setIsLoading(true);
    try {
      const module = await import('framer-motion');
      setMotion(module.motion);
      return module.motion;
    } catch (error) {
      console.error('Failed to load framer-motion:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { motion, isLoading, loadFramerMotion };
};

export const useLazyGSAP = () => {
  const [gsap, setGsap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadGSAP = async () => {
    if (gsap) return gsap;
    
    setIsLoading(true);
    try {
      const module = await import('gsap');
      setGsap(module.gsap);
      return module.gsap;
    } catch (error) {
      console.error('Failed to load GSAP:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { gsap, isLoading, loadGSAP };
};

export const useLazyHtml2Canvas = () => {
  const [html2canvas, setHtml2canvas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadHtml2Canvas = async () => {
    if (html2canvas) return html2canvas;
    
    setIsLoading(true);
    try {
      const module = await import('html2canvas');
      setHtml2canvas(module.default);
      return module.default;
    } catch (error) {
      console.error('Failed to load html2canvas:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { html2canvas, isLoading, loadHtml2Canvas };
};

export const useLazyDateFns = () => {
  const [dateFns, setDateFns] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadDateFns = async () => {
    if (dateFns) return dateFns;
    
    setIsLoading(true);
    try {
      const module = await import('date-fns');
      setDateFns(module);
      return module;
    } catch (error) {
      console.error('Failed to load date-fns:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { dateFns, isLoading, loadDateFns };
};

export const useLazyLodash = () => {
  const [lodash, setLodash] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadLodash = async () => {
    if (lodash) return lodash;
    
    setIsLoading(true);
    try {
      const module = await import('lodash');
      setLodash(module);
      return module;
    } catch (error) {
      console.error('Failed to load lodash:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { lodash, isLoading, loadLodash };
};

// Wrapper component for lazy loading with error boundary
export const LazyWrapper: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = <LoadingSpinner /> }) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload only the most critical components
  const criticalComponents = [
    () => import('./Button'),
    () => import('./Card'),
    () => import('./Modal/Modal'),
  ];

  criticalComponents.forEach(loader => {
    loader().catch(console.error);
  });
};

// Preload components based on user interaction
export const preloadOnHover = (loader: () => Promise<any>) => {
  let preloaded = false;
  
  return {
    onMouseEnter: () => {
      if (!preloaded) {
        preloaded = true;
        loader().catch(console.error);
      }
    }
  };
};

// Preload components based on route
export const preloadRouteComponents = (route: string) => {
  const routeComponents: Record<string, (() => Promise<any>)[]> = {
    '/ai': [
      () => import('../ai-chat/AIChatBubble'),
      () => import('../ai-chat/AIChatModal'),
    ],
    '/documentation': [
      () => import('./LightweightMarkdown'),
      () => import('react-syntax-highlighter'),
    ],
    '/features': [
      () => import('../landing/AdvancedCodeInterface'),
      () => import('../landing/AIHighlights'),
    ],
  };

  const components = routeComponents[route];
  if (components) {
    components.forEach(loader => {
      loader().catch(console.error);
    });
  }
}; 