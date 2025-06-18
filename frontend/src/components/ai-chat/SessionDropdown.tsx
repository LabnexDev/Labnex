import React from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { ChevronDownIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { aiSessionsApi } from '../../api/aiSessions';

const SessionDropdown: React.FC = () => {
  const { sessions, currentSessionId, switchSession, createNewSession } = useAIChat();
  const [open, setOpen] = React.useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this session?')) return;
    await aiSessionsApi.deleteSession(id);
    window.location.reload();
  };

  const current = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="relative">
      <button className="flex items-center gap-1 text-sm font-medium" onClick={() => setOpen(o => !o)}>
        <span>{current?.title || 'Untitled Session'}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-56 bg-slate-800 border border-slate-700 rounded shadow-lg">
          <button onClick={createNewSession} className="flex items-center w-full px-3 py-2 hover:bg-slate-700 text-left text-sm gap-2">
            <PlusCircleIcon className="h-4 w-4" /> New Session
          </button>
          <div className="max-h-60 overflow-y-auto">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-700 text-sm">
                <button onClick={() => { switchSession(s.id); setOpen(false); }} className="flex-1 text-left">
                  {s.title}
                </button>
                <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionDropdown; 