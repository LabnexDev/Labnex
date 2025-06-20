import React, { useEffect, useState } from 'react';
import { getMemory, resetMemory, type IntentMemory } from '../../utils/voiceContext';

interface Props {
  showReset?: boolean;
}

const MemoryPanel: React.FC<Props> = ({ showReset = true }) => {
  const [memory, setMemory] = useState<IntentMemory>({ ...getMemory() });
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const mem = getMemory();
      setMemory({ ...mem });
      setIsStale(Date.now() - mem.lastUpdated > 2 * 60 * 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    resetMemory();
    setMemory({ ...getMemory() });
  };

  return (
    <div className="bg-slate-800 text-slate-200 p-3 rounded-lg text-sm max-w-sm">
      <div className="font-semibold mb-1 flex items-center justify-between">
        Memory Inspector {isStale && <span className="text-yellow-400 text-xs">(stale)</span>}
        {showReset && (
          <button onClick={handleReset} className="ml-2 px-2 py-1 bg-red-600/70 rounded text-xs">Reset</button>
        )}
      </div>
      <pre className="whitespace-pre-wrap break-words text-xs bg-slate-900 p-2 rounded">
        {JSON.stringify({
          activeProject: memory.activeProject,
          lastIntent: memory.lastIntent,
          lastTask: memory.lastTask,
          parseFailures: memory.parseFailures,
          lastSuggestion: memory.lastSuggestion,
          lastSuggestionConfirmed: memory.lastSuggestionConfirmed,
          lastUpdated: new Date(memory.lastUpdated).toLocaleTimeString()
        }, null, 2)}
      </pre>
    </div>
  );
};

export default MemoryPanel; 