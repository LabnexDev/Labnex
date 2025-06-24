import React, { Suspense, lazy } from 'react';

// Lazy load the heavy syntax highlighter components
const LazySyntaxHighlighterComponent = lazy(() => import('react-syntax-highlighter'));

interface LazySyntaxHighlighterProps {
  children: string;
  language: string;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
  customStyle?: React.CSSProperties;
  lineNumberStyle?: React.CSSProperties;
  className?: string;
}

const SyntaxFallback: React.FC = () => (
  <div className="animate-pulse bg-slate-900 p-4 rounded">
    <div className="h-4 bg-slate-700 rounded mb-2"></div>
    <div className="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
    <div className="h-4 bg-slate-700 rounded mb-2 w-1/2"></div>
  </div>
);

export const LazySyntaxHighlighter: React.FC<LazySyntaxHighlighterProps> = ({ 
  children, 
  language,
  showLineNumbers = false,
  wrapLines = true,
  customStyle = {},
  lineNumberStyle = {},
  className = ''
}) => {
  return (
    <Suspense fallback={<SyntaxFallback />}>
      <LazySyntaxHighlighterComponent
        language={language.toLowerCase()}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        customStyle={{ padding: '0.75rem', margin: 0, background: 'transparent', fontSize: '0.8rem', ...customStyle }}
        lineNumberStyle={{ minWidth: '2.25em', ...lineNumberStyle }}
        className={`!bg-transparent ${className}`}
      >
        {children}
      </LazySyntaxHighlighterComponent>
    </Suspense>
  );
}; 