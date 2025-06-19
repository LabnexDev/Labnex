import React from 'react';
import { CogIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface AIPreviewPanelProps {
  currentAction: string;
  status: 'idle' | 'listening' | 'analyzing' | 'speaking' | 'paused' | 'error';
}

const AIPreviewPanel: React.FC<AIPreviewPanelProps> = ({ currentAction, status }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'analyzing':
      case 'speaking':
        return <CogIcon className="h-4 w-4 animate-spin text-purple-400" />;
      case 'listening':
        return <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse" />;
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'analyzing':
      case 'speaking':
        return 'text-purple-300';
      case 'listening':
        return 'text-green-300';
      case 'error':
        return 'text-red-300';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="hidden lg:flex flex-col justify-start h-full">
      <div className="bg-slate-800/50 rounded-lg p-4 backdrop-blur-sm border border-slate-700/50">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-2 w-2 bg-emerald-400 rounded-full"></div>
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">AI Console</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-mono ${getStatusColor()}`}>
              {currentAction || 'Standby'}
            </span>
          </div>
          
          {status === 'analyzing' && (
            <div className="text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-1">
                <span className="animate-pulse">▸</span>
                Processing natural language...
              </div>
              <div className="flex items-center gap-1 ml-2">
                <span className="animate-pulse">▸</span>
                Determining intent...
              </div>
            </div>
          )}
          
          {status === 'speaking' && (
            <div className="text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-1">
                <span className="animate-pulse">▸</span>
                Generating speech...
              </div>
              <div className="flex items-center gap-1 ml-2">
                <span className="animate-pulse">▸</span>
                Audio playback active
              </div>
            </div>
          )}
          
          {status === 'listening' && (
            <div className="text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-1">
                <span className="animate-pulse">▸</span>
                Microphone active
              </div>
              <div className="flex items-center gap-1 ml-2">
                <span className="animate-pulse">▸</span>
                Speech recognition ready
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPreviewPanel; 