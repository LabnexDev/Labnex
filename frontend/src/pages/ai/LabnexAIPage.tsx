import React, { useRef, useEffect } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import AIResponseBox from '../../components/visual/AIResponseBox';

const LabnexAIPage: React.FC = () => {
  const { messages, sendMessage } = useAIChat();
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value || '';
    if (value.trim()) {
      sendMessage(value.trim());
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSummarize = () => {
    sendMessage('Summarize the current project activity and provide key insights.');
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 dark:border-slate-700">
        <h1 className="text-lg font-semibold">Labnex AI Dashboard</h1>
        <button
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          onClick={handleSummarize}
        >
          Summarize Activity
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-900/40">
        {messages.map(msg => (
          msg.role === 'assistant' ? (
            <AIResponseBox key={msg.id} message={msg.content} staticRender={true} />
          ) : (
            <div key={msg.id} className="text-right">
              <div className="inline-block bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm max-w-xl whitespace-pre-wrap">
                {msg.content}
              </div>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700 flex items-center gap-3">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask Labnex AI…"
          className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-400 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
        >
          <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
        </button>
      </form>
    </div>
  );
};

export default LabnexAIPage; 