import React, { useEffect, useState } from 'react';

interface TimelineEvent {
  id: number;
  text: string;
}

interface VoiceStatusTimelineProps {
  events: TimelineEvent[];
}

const VoiceStatusTimeline: React.FC<VoiceStatusTimelineProps> = ({ events }) => {
  const [displayed, setDisplayed] = useState<TimelineEvent[]>(events);

  useEffect(() => {
    setDisplayed(events.slice(-5)); // keep last 5 events
  }, [events]);

  return (
    <div className="fixed bottom-4 left-4 z-40 w-64 select-none">
      <div className="bg-neutral-900/60 backdrop-blur-md rounded-xl p-4 shadow-lg divide-y divide-white/10">
        {displayed.map((ev, idx) => (
          <div
            key={ev.id}
            className="flex items-start gap-3 py-2 animate-fadeIn"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400 flex-shrink-0" />
            <p className="text-sm text-white/90 font-medium leading-snug">{ev.text}</p>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeIn { from {opacity:0; transform:translateY(4px);} to {opacity:1;transform:translateY(0);} }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out forwards; }
      `}</style>
    </div>
  );
};

export type { TimelineEvent };
export default VoiceStatusTimeline; 