import React from 'react';
import { LoadingSpinner } from '../common/LoadingSpinner';

const AIScanningIndicator: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-2 animate-pulse text-slate-400">
      <p className="text-xs mb-2 font-mono tracking-tight">Analyzing page context…</p>
      <LoadingSpinner size="sm" />
    </div>
  );
};

export default AIScanningIndicator; 