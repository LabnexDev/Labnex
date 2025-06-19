import React, { useRef, useEffect, useState } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { PaperAirplaneIcon, Bars3Icon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon, ChatBubbleLeftRightIcon, CommandLineIcon } from '@heroicons/react/24/solid';
import AIResponseBox from '../../components/visual/AIResponseBox';
import TypingDots from '../../components/visual/TypingDots';
import AIScanningIndicator from '../../components/visual/AIScanningIndicator';
import SlashCommandAutocomplete from '../../components/ai-chat/SlashCommandAutocomplete';
import SessionDropdown from '../../components/ai-chat/SessionDropdown';
import VoiceControls from '../../components/ai-chat/VoiceControls';
import { useNavigate } from 'react-router-dom';

const LabnexAIPage: React.FC = () => {
  const { messages, sendMessage, isTyping, isScanning, hasMore, loadOlder } = useAIChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isScanning]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        navigate('/ai/voice');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  // Handle slash commands
  useEffect(() => {
    setShowAutocomplete(inputValue.startsWith('/') && inputValue.length > 1);
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue('');
    setShowAutocomplete(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim()) return;
      sendMessage(inputValue.trim());
      setInputValue('');
      setShowAutocomplete(false);
    }
    if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleSummarize = () => {
    sendMessage('Summarize the current project activity and provide key insights.');
    setShowMobileMenu(false);
  };

  const handleVoiceMode = () => {
    navigate('/ai/voice');
    setShowMobileMenu(false);
  };

  const quickCommands = [
    { label: '📊 Project Summary', command: 'Provide a comprehensive summary of the current project status and key metrics.' },
    { label: '🔍 Code Review', command: 'Review the latest code changes and suggest improvements.' },
    { label: '🚀 Deploy Guide', command: 'Show me the deployment checklist and best practices.' },
    { label: '🐛 Debug Help', command: 'Help me debug the current issue I\'m facing.' },
  ];

  const handleQuickCommand = (command: string) => {
    sendMessage(command);
    setShowMobileMenu(false);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Enhanced Header with Gradient */}
      <header className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md sticky top-0 z-20 shadow-lg shadow-purple-500/5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {/* Enhanced icon with gradient */}
            <div className="relative p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-500/30">
              <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 truncate">
                Labnex AI Chat
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">Powered by Advanced AI</p>
            </div>
          </div>
          
          {/* Desktop Session Dropdown */}
          <div className="hidden md:block">
            <SessionDropdown />
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-purple-500/20 border border-purple-500/30"
            onClick={handleSummarize}
          >
            <SparklesIcon className="h-4 w-4 inline mr-1" />
            Summarize
          </button>
          <button
            onClick={handleVoiceMode}
            className="px-3 py-2 flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium transition-all duration-200 hover:scale-[1.02] shadow-lg shadow-emerald-500/20 border border-emerald-500/30"
          >
            <MicrophoneIcon className="h-4 w-4" />
            Voice Mode
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 border border-slate-600/30 backdrop-blur-sm"
        >
          {showMobileMenu ? (
            <XMarkIcon className="h-5 w-5 text-white" />
          ) : (
            <Bars3Icon className="h-5 w-5 text-white" />
          )}
        </button>
      </header>

      {/* Enhanced Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-r from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-md border-b border-slate-700/50 z-10 p-4 space-y-4 shadow-xl">
          <SessionDropdown />
          
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-purple-500/20 border border-purple-500/30"
              onClick={handleSummarize}
            >
              <SparklesIcon className="h-4 w-4 inline mr-2" />
              Summarize
            </button>
            <button
              onClick={handleVoiceMode}
              className="px-4 py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 border border-emerald-500/30"
            >
              <MicrophoneIcon className="h-4 w-4" />
              Voice Mode
            </button>
          </div>

          {/* Quick Commands */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quick Commands</h3>
            <div className="grid grid-cols-1 gap-2">
              {quickCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickCommand(cmd.command)}
                  className="px-3 py-2 text-sm text-left rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 transition-colors border border-slate-600/30"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area with Enhanced Styling */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-indigo-500/10"></div>
        </div>

        <div className="relative px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          <div className="max-w-4xl w-full mx-auto flex flex-col gap-4 sm:gap-6">
            {hasMore && (
              <button 
                onClick={loadOlder} 
                className="self-center text-xs sm:text-sm text-purple-400 hover:text-purple-300 underline py-2 px-4 rounded-xl hover:bg-slate-800/50 transition-all duration-200 border border-purple-500/20 bg-slate-900/30 backdrop-blur-sm"
              >
                Load older messages
              </button>
            )}
            
            {messages.map(msg => (
              msg.role === 'assistant' ? (
                <div key={msg.id} className="w-full">
                  <AIResponseBox message={msg.content} staticRender={true} />
                </div>
              ) : (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[75%] lg:max-w-prose">
                    <div className="inline-block bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-purple-600/90 text-white px-4 py-3 rounded-2xl rounded-tr-lg text-sm sm:text-base whitespace-pre-wrap shadow-lg shadow-purple-500/20 break-words border border-purple-500/30 backdrop-blur-sm">
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            ))}
            
            {isScanning && (
              <div className="w-full">
                <AIScanningIndicator />
              </div>
            )}
            
            {isTyping && !isScanning && (
              <div className="w-full">
                <TypingDots />
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Enhanced Input Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-md border-t border-slate-700/50 shadow-2xl shadow-purple-500/5">
        <form onSubmit={handleSubmit} className="p-3 sm:p-4">
          <div className="max-w-4xl mx-auto relative">
                         {/* Autocomplete */}
             {showAutocomplete && (
               <div className="absolute bottom-full left-0 right-0 mb-2">
                 <SlashCommandAutocomplete 
                   query={inputValue}
                   onSelect={(command) => {
                     setInputValue(`/${command} `);
                     setShowAutocomplete(false);
                     textareaRef.current?.focus();
                   }}
                 />
               </div>
             )}

            <div className="flex items-end gap-2 sm:gap-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-2xl p-3 border border-slate-600/40 backdrop-blur-sm shadow-lg shadow-purple-500/5">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask Labnex AI anything... (Type / for commands)"
                  className="w-full resize-none bg-transparent focus:outline-none text-slate-100 placeholder-slate-400 py-2 px-3 rounded-xl max-h-[120px] text-sm sm:text-base"
                  style={{ minHeight: '44px' }}
                />
                
                {/* Command indicator */}
                {inputValue.startsWith('/') && (
                  <div className="absolute right-2 top-2 text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded border border-purple-500/30">
                    <CommandLineIcon className="h-3 w-3 inline mr-1" />
                    Command
                  </div>
                )}
              </div>
              
              {/* Voice Controls */}
              <VoiceControls />
              
              {/* Enhanced Send Button */}
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 disabled:hover:scale-100 hover:scale-105 shadow-lg shadow-purple-500/20 border border-purple-500/30 min-w-[48px] min-h-[48px] flex items-center justify-center"
                title="Send message (Enter)"
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Input hints */}
            <div className="flex items-center justify-between mt-2 px-2 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <span>Press <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded border border-slate-600/50">Enter</kbd> to send</span>
                <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded border border-slate-600/50">Ctrl+Shift+V</kbd> for voice</span>
              </div>
              <span className="text-purple-400/70">Type <code>/</code> for commands</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LabnexAIPage; 