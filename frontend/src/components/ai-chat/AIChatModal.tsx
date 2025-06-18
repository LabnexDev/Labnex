import React, { useRef, useEffect } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';
import AIResponseBox from '../visual/AIResponseBox';
import { useNavigate } from 'react-router-dom';

const AIChatModal: React.FC = () => {
  const { isOpen, close, messages, sendMessage } = useAIChat();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when messages change
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Focus on open
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value || '';
    if (value.trim()) {
      sendMessage(value.trim());
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end sm:items-center sm:justify-center bg-black/30 backdrop-blur-sm">
      {/* Chat container */}
      <div className="relative w-full sm:max-w-md h-[70vh] sm:h-[80vh] bg-slate-900 text-slate-100 rounded-t-2xl sm:rounded-2xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-base font-semibold">Labnex AI Assistant</h2>
          <button onClick={close} aria-label="Close chat" className="p-1 rounded hover:bg-slate-700/50">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {messages.map(msg => (
            msg.role === 'assistant' ? (
              <AIResponseBox key={msg.id} message={msg.content} staticRender={true} />
            ) : (
              <div key={msg.id} className="text-right">
                <div className="inline-block bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm max-w-xs whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            )
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-700 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your message..."
            className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-400 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            aria-label="Send"
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="h-5 w-5 rotate-45" />
          </button>
        </form>
        <button
          onClick={() => { close(); navigate('/ai'); }}
          className="text-xs text-indigo-400 hover:text-indigo-300 p-2 underline w-full"
        >
          Open full AI dashboard
        </button>
      </div>
    </div>
  );
};

export default AIChatModal; 