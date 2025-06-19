import React from 'react';
import { CheckCircleIcon, CogIcon, CubeTransparentIcon, EllipsisHorizontalCircleIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

export type TimelineEventState = 'listening' | 'transcribing' | 'analyzing' | 'executing' | 'done' | 'idle' | 'error' | 'waiting';

export interface TimelineEvent {
  id: number;
  label: string;
  state: TimelineEventState;
}

interface VoiceStatusTimelineProps {
  events: TimelineEvent[];
  compact?: boolean; // For mobile/smaller displays
}

const stateIcons: Record<TimelineEventState, React.FC<{ className: string }>> = {
  listening: MicrophoneIcon,
  transcribing: EllipsisHorizontalCircleIcon,
  analyzing: CogIcon,
  executing: SpeakerWaveIcon,
  done: CheckCircleIcon,
  idle: CubeTransparentIcon,
  error: CheckCircleIcon,
  waiting: EllipsisHorizontalCircleIcon,
};

const stateColors: Record<TimelineEventState, string> = {
  listening: 'bg-green-500/50 text-green-300 border-green-400/30',
  transcribing: 'bg-blue-500/50 text-blue-300 border-blue-400/30',
  analyzing: 'bg-purple-500/50 text-purple-300 border-purple-400/30',
  executing: 'bg-indigo-500/50 text-indigo-300 border-indigo-400/30',
  done: 'bg-emerald-500/50 text-emerald-300 border-emerald-400/30',
  idle: 'bg-slate-600/50 text-slate-400 border-slate-500/30',
  error: 'bg-red-500/50 text-red-300 border-red-400/30',
  waiting: 'bg-yellow-500/50 text-yellow-300 border-yellow-400/30',
};

const VoiceStatusTimeline: React.FC<VoiceStatusTimelineProps> = ({ events, compact = false }) => {
  const displayEvents = events.slice(0, compact ? 4 : 8);

  if (compact) {
    // Mobile compact horizontal layout
    return (
      <div className="w-full">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayEvents.map((event, index) => {
            const Icon = stateIcons[event.state] || EllipsisHorizontalCircleIcon;
            const isLatest = index === 0;
            const colorClasses = stateColors[event.state];
            
            return (
              <div 
                key={event.id} 
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-2 rounded-lg transition-all duration-300 ${
                  isLatest ? 'bg-slate-800/50' : 'bg-slate-800/20'
                }`}
                style={{ minWidth: '80px' }}
              >
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${colorClasses}`}>
                  <Icon className="h-4 w-4" />
                  {(event.state === 'listening' || event.state === 'analyzing') && isLatest && (
                    <span className="absolute h-full w-full animate-ping rounded-full bg-current opacity-20"></span>
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium truncate max-w-[70px] ${
                    isLatest ? 'text-white' : 'text-slate-400'
                  }`}>
                    {event.label.length > 10 ? event.label.slice(0, 8) + '...' : event.label}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {isLatest ? 'now' : `${index}m`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <style>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    );
  }

  // Desktop vertical layout
  return (
    <div 
      className="h-full max-h-[400px] overflow-y-auto rounded-xl bg-slate-800/30 p-4 sm:p-5 backdrop-blur-md border border-slate-600/20 shadow-lg"
      role="log"
      aria-label="Voice interaction timeline"
      aria-live="polite"
    >
      <div className="space-y-3 sm:space-y-4">
        {displayEvents.map((event, index) => {
          const Icon = stateIcons[event.state] || EllipsisHorizontalCircleIcon;
          const isRecent = index < 3;
          const isLatest = index === 0;
          const colorClasses = stateColors[event.state];
          
          return (
            <div 
              key={event.id} 
              className={`flex items-start gap-3 sm:gap-4 transition-all duration-500 ${
                isRecent ? 'opacity-100' : 'opacity-60'
              } ${isLatest ? 'transform scale-105' : ''}`}
              style={{ 
                animationDelay: `${index * 100}ms`,
                animation: isLatest ? 'slideIn 0.3s ease-out' : 'none'
              }}
            >
              {/* Timeline connector */}
              <div className="relative flex flex-col items-center">
                <div className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${colorClasses}`}>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  
                  {/* Pulse animation for active states */}
                  {(event.state === 'listening' || event.state === 'analyzing') && isLatest && (
                    <span className="absolute h-full w-full animate-ping rounded-full bg-current opacity-20"></span>
                  )}
                  
                  {/* Glow effect for latest event */}
                  {isLatest && (
                    <span className="absolute h-full w-full animate-pulse rounded-full bg-current opacity-10 scale-150"></span>
                  )}
                </div>
                
                {/* Connecting line */}
                {index < displayEvents.length - 1 && (
                  <div className="w-0.5 h-5 sm:h-6 bg-gradient-to-b from-slate-500/50 to-transparent mt-2"></div>
                )}
              </div>
              
              {/* Event content */}
              <div className="flex-1 min-w-0 pb-2">
                <div className={`font-medium text-xs sm:text-sm leading-tight transition-colors duration-300 break-words ${
                  isLatest ? 'text-white' : isRecent ? 'text-slate-300' : 'text-slate-400'
                }`}>
                  {event.label}
                </div>
                
                {/* Timestamp indicator */}
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  {isLatest ? 'now' : `${index * 2}s ago`}
                </div>
                
                {/* Progress bar for active states */}
                {(event.state === 'analyzing' || event.state === 'executing') && isLatest && (
                  <div className="w-full bg-slate-700/50 rounded-full h-1 mt-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Empty state */}
        {displayEvents.length === 0 && (
          <div className="text-center py-6 sm:py-8 text-slate-500">
            <CubeTransparentIcon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs sm:text-sm">No activity yet</p>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceStatusTimeline; 