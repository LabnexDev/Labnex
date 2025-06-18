import React from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { ChevronDownIcon, PlusCircleIcon, TrashIcon, PencilIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { aiSessionsApi } from '../../api/aiSessions';

const SessionDropdown: React.FC = () => {
  const { sessions, currentSessionId, switchSession, createNewSession } = useAIChat();
  const [open, setOpen] = React.useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this session?')) return;
    await aiSessionsApi.deleteSession(id);
    window.location.reload();
  };

  const handleRename = async (id: string) => {
    const newTitle = prompt('New session title:', sessions.find(s => s.id === id)?.title || '');
    if (!newTitle) return;
    await aiSessionsApi.renameSession(id, newTitle);
    window.location.reload();
  };

  const handleExport = async (id: string) => {
    // Fetch all messages
    const limit = 100;
    let page = 1;
    let all: any[] = [];
    while (true) {
      const batch = await import('../../api/aiMessages').then(m => m.aiMessagesApi.fetchMessages(undefined, page, limit, id));
      all = all.concat(batch);
      if (batch.length < limit) break;
      page += 1;
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessions.find(s => s.id === id)?.title || 'session'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const current = sessions.find(s => s.id === currentSessionId);

  return (
    <div className="relative">
      <button className="flex items-center gap-1 text-sm font-medium max-w-[120px] sm:max-w-none truncate" onClick={() => setOpen(o => !o)}>
        <span className="truncate">{current?.title || 'Untitled Session'}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-64 bg-slate-800 border border-slate-700 rounded shadow-lg">
          <button onClick={createNewSession} className="flex items-center w-full px-3 py-2 hover:bg-slate-700 text-left text-sm gap-2">
            <PlusCircleIcon className="h-4 w-4" /> New Session
          </button>
          <div className="max-h-60 overflow-y-auto">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-700 text-sm gap-2">
                <button onClick={() => { switchSession(s.id); setOpen(false); }} className="flex-1 text-left overflow-hidden text-ellipsis whitespace-nowrap">
                  {s.title}
                </button>
                <button onClick={() => handleRename(s.id)} className="text-indigo-400 hover:text-indigo-300">
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button onClick={() => handleExport(s.id)} className="text-green-400 hover:text-green-300">
                  <ArrowDownTrayIcon className="h-4 w-4" />
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