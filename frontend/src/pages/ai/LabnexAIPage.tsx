import React, { useRef, useEffect, useState } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import AIResponseBox from '../../components/visual/AIResponseBox';
import TypingDots from '../../components/visual/TypingDots';
import AIScanningIndicator from '../../components/visual/AIScanningIndicator';
import SlashCommandAutocomplete from '../../components/ai-chat/SlashCommandAutocomplete';
import SessionDropdown from '../../components/ai-chat/SessionDropdown';

const LabnexAIPage: React.FC = () => {
  const { messages, sendMessage, isTyping, isScanning } = useAIChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isScanning]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim()) return;
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleSummarize = () => {
    sendMessage('Summarize the current project activity and provide key insights.');
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Labnex AI Dashboard</h1>
          <SessionDropdown />
        </div>
        <button
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
          onClick={handleSummarize}
        >
          Summarize Activity
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 bg-slate-900/60 backdrop-blur-lg">
        <div className="max-w-3xl w-full mx-auto flex flex-col gap-6">
          {messages.map(msg => (
            msg.role === 'assistant' ? (
              <AIResponseBox key={msg.id} message={msg.content} staticRender={true} />
            ) : (
              <div key={msg.id} className="self-end text-right">
                <div className="inline-block bg-indigo-600 text-white px-4 py-3 rounded-lg text-sm max-w-prose whitespace-pre-wrap shadow-lg">
                  {msg.content}
                </div>
              </div>
            )
          ))}
          {isScanning && (
            <div className="self-start">
              <AIScanningIndicator />
            </div>
          )}
          {isTyping && !isScanning && (
            <div className="self-start">
              <TypingDots />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="sticky bottom-0 left-0 right-0 bg-slate-800/70 backdrop-blur-md border-t border-slate-700 px-4 sm:px-6 py-3 flex items-end gap-3 relative">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask Labnex AI…"
          className="flex-1 resize-none bg-transparent focus:outline-none text-slate-100 placeholder-slate-400 p-2 sm:p-3 rounded-lg max-h-40"
        />
        {/* Autocomplete */}
        <SlashCommandAutocomplete query={inputValue} onSelect={(cmd) => setInputValue(`/${cmd} `)} />
        <button
          type="submit"
          disabled={!inputValue.trim()}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default LabnexAIPage; 