import React, { useMemo } from 'react';
import { LightBulbIcon, PlayIcon, Cog6ToothIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

export type TimelineEvent = {
  id: number;
  label: string;
  state: 'idle' | 'listening' | 'transcribing' | 'analyzing' | 'executing' | 'done';
  timestamp?: string;
};

const stateStyle: Record<TimelineEvent['state'], string> = {
  idle: 'border-neutral-600 text-neutral-400',
  listening: 'text-blue-400',
  transcribing: 'text-indigo-400',
  analyzing: 'text-yellow-400',
  executing: 'text-purple-400',
  done: 'text-green-400',
};

interface VoiceTimelineProps {
  events: TimelineEvent[];
  thought?: string;
  developerMode?: boolean;
  devPayload?: any;
}

const VoiceTimeline: React.FC<VoiceTimelineProps> = ({ events, thought, developerMode, devPayload }) => {
  const latest = useMemo(() => {
    const sliced = events.slice(-15);
    const grouped: (TimelineEvent & { count: number })[] = [];
    for (const ev of sliced) {
      const prev = grouped[grouped.length - 1];
      if (prev && prev.label === ev.label && prev.state === ev.state) {
        prev.count += 1;
      } else {
        grouped.push({ ...ev, count: 1 });
      }
    }
    return grouped.slice(-7);
  }, [events]);

  return (
    <div className="w-full max-w-xs px-2 pt-4 overflow-y-auto">
      <ol className="relative border-l border-neutral-700/60">
        {latest.map((ev, idx) => (
          <li key={idx} className={`ml-4 pb-2 ${stateStyle[ev.state] || ''}`}>
            <span className="absolute -left-1.5 top-1 h-2 w-2 rounded-full bg-current" />
            <p className="text-sm leading-tight capitalize flex items-center gap-1">
              {iconForState(ev.state)} {ev.label}
              {ev.count > 1 && <span className="text-xs text-neutral-400">×{ev.count}</span>}
            </p>
          </li>
        ))}
      </ol>

      {/* Thought overlay */}
      {thought && (
        <div className="mt-3 flex items-start gap-2 text-neutral-300">
          <LightBulbIcon className="h-4 w-4 flex-shrink-0 text-yellow-400" />
          <p className="text-xs leading-snug italic">{thought}</p>
        </div>
      )}

      {/* Dev panel */}
      {developerMode && devPayload && (
        <pre className="mt-2 max-h-40 overflow-y-auto text-[10px] text-neutral-400">{JSON.stringify(devPayload, null, 2)}</pre>
      )}
    </div>
  );
};

function iconForState(state: TimelineEvent['state']) {
  switch (state) {
    case 'listening':
      return <MicrophoneIcon className="h-3 w-3 text-blue-400" />;
    case 'executing':
      return <Cog6ToothIcon className="h-3 w-3 text-purple-400" />;
    case 'done':
      return <PlayIcon className="h-3 w-3 text-green-400" />;
    default:
      return null;
  }
}

export default VoiceTimeline; 