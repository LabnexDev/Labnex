import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { PaperAirplaneIcon, Bars3Icon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon, ChatBubbleLeftRightIcon, CommandLineIcon } from '@heroicons/react/24/solid';
import AIResponseBox from '../../components/visual/AIResponseBox';
import TypingDots from '../../components/visual/TypingDots';
import AIScanningIndicator from '../../components/visual/AIScanningIndicator';
import SlashCommandAutocomplete, { type AutocompleteRef } from '../../components/ai-chat/SlashCommandAutocomplete';
import SessionDropdown from '../../components/ai-chat/SessionDropdown';
import VoiceControls from '../../components/ai-chat/VoiceControls';
import AIChatTutorial from '../../components/onboarding/AIChatTutorial';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LabnexAIPage: React.FC = () => {
  const { messages, sendMessage, isTyping, isScanning, hasMore, loadOlder } = useAIChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autocompleteRef = useRef<AutocompleteRef>(null);
  const [inputValue, setInputValue] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  // Check if user has seen the tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('labnex_ai_chat_tutorial_completed');
    if (!hasSeenTutorial) {
      // Show tutorial after a delay to let the page load
      const timer = setTimeout(() => setShowTutorial(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, isScanning]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        navigate('/ai/voice');
      }
      if (e.key === 'Escape' && showMobileMenu) {
        setShowMobileMenu(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate, showMobileMenu]);

  // Debounced auto-resize textarea
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    
    resizeTimeoutRef.current = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    }, 50); // 50ms debounce
  }, []);

  useEffect(() => {
    debouncedResize();
  }, [inputValue, debouncedResize]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

  // Handle slash commands
  useEffect(() => {
    setShowAutocomplete(inputValue.startsWith('/') && inputValue.length >= 1);
  }, [inputValue]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    try {
      setHasError(false);
      await sendMessage(inputValue.trim());
      setInputValue('');
      setShowAutocomplete(false);
    } catch (error: any) {
      setHasError(true);
      toast.error(error.message || 'Failed to send message. Please try again.');
      console.error('Send message error:', error);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Forward keyboard events to the autocomplete if it's showing
    if (showAutocomplete && autocompleteRef.current) {
      const handled = autocompleteRef.current.handleExternalKeyDown(e);
      if (handled) {
        e.preventDefault();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim()) return;
      
      // Don't send if autocomplete is showing (it should have been handled above)
      if (showAutocomplete) return;
      
      try {
        setHasError(false);
        await sendMessage(inputValue.trim());
        setInputValue('');
        setShowAutocomplete(false);
      } catch (error: any) {
        setHasError(true);
        toast.error(error.message || 'Failed to send message. Please try again.');
        console.error('Send message error:', error);
      }
    }
    if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleSummarize = async () => {
    try {
      setHasError(false);
      await sendMessage('Summarize the current project activity and provide key insights.');
      setShowMobileMenu(false);
    } catch (error: any) {
      setHasError(true);
      toast.error('Failed to generate summary. Please try again.');
      console.error('Summarize error:', error);
    }
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

  const handleQuickCommand = async (command: string) => {
    try {
      setHasError(false);
      await sendMessage(command);
      setShowMobileMenu(false);
    } catch (error: any) {
      setHasError(true);
      toast.error('Failed to execute command. Please try again.');
      console.error('Quick command error:', error);
    }
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen overflow-hidden">
      {/* Enhanced Header with Gradient */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md sticky top-0 z-30 shadow-lg shadow-purple-500/5 h-14 sm:h-auto">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Enhanced icon with gradient */}
            <div className="relative p-1.5 sm:p-2 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 rounded-lg sm:rounded-xl border border-purple-500/30">
              <ChatBubbleLeftRightIcon className="h-4 w-4 sm:h-6 sm:w-6 text-purple-400" />
              <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-2 w-2 sm:h-3 sm:w-3 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-300 to-indigo-400 truncate">
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
            onClick={() => setShowTutorial(true)}
            className="px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 text-sm font-medium transition-all duration-200 hover:scale-[1.02] border border-slate-600/30"
            title="Show tutorial"
          >
            ?
          </button>
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
          className="md:hidden p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 transition-all duration-200 border border-slate-600/30 backdrop-blur-sm touch-manipulation"
          aria-label="Menu"
        >
          {showMobileMenu ? (
            <XMarkIcon className="h-5 w-5 text-white" />
          ) : (
            <Bars3Icon className="h-5 w-5 text-white" />
          )}
        </button>
      </header>

      {/* Mobile Menu Backdrop with Higher Z-Index */}
      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Enhanced Mobile Menu with Improved Mobile Layout */}
      {showMobileMenu && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-gradient-to-r from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-md border-b border-slate-700/50 z-[110] px-3 py-3 space-y-3 shadow-2xl animate-in slide-in-from-top-5 duration-200 max-h-[calc(100vh-56px)] overflow-y-auto">
          {/* Mobile Session Dropdown */}
          <div className="mb-3">
            <SessionDropdown />
          </div>
          
          {/* Primary Actions */}
          <div className="grid grid-cols-1 gap-2">
            <button
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600/80 to-purple-600/80 hover:from-indigo-600 hover:to-purple-600 active:scale-95 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-purple-500/20 border border-purple-500/30 min-h-[48px] flex items-center justify-center touch-manipulation"
              onClick={() => {
                handleSummarize();
                setShowMobileMenu(false);
              }}
            >
              <SparklesIcon className="h-4 w-4 inline mr-2" />
              Summarize Project
            </button>
            <button
              onClick={() => {
                handleVoiceMode();
                setShowMobileMenu(false);
              }}
              className="w-full px-4 py-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-500/20 border border-emerald-500/30 min-h-[48px] touch-manipulation"
            >
              <MicrophoneIcon className="h-4 w-4" />
              Voice Mode
            </button>
          </div>

          {/* Quick Commands */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">Quick Commands</h3>
            <div className="grid grid-cols-1 gap-2">
              {quickCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleQuickCommand(cmd.command);
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-3 py-3 text-sm text-left rounded-lg bg-slate-800/50 hover:bg-slate-700/50 active:bg-slate-700/70 text-slate-300 transition-colors border border-slate-600/30 min-h-[48px] flex items-center touch-manipulation"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Help Button */}
          <button
            onClick={() => {
              setShowTutorial(true);
              setShowMobileMenu(false);
            }}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-700/60 active:bg-slate-700/80 text-slate-300 text-sm font-medium transition-all duration-200 border border-slate-600/30 touch-manipulation"
          >
            📚 Show Tutorial
          </button>
        </div>
      )}

      {/* Enhanced CSS for mobile animations */}
      <style>{`
        @keyframes slide-in-from-top-5 {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-in {
          animation-fill-mode: both;
        }

        .slide-in-from-top-5 {
          animation-name: slide-in-from-top-5;
        }

        .duration-200 {
          animation-duration: 200ms;
        }

        /* Mobile touch improvements */
        @media (hover: none) and (pointer: coarse) {
          button:hover {
            background-color: inherit !important;
          }
          
          button:active {
            transform: scale(0.95) !important;
          }
        }
      `}</style>

      {/* Messages Area with Enhanced Mobile Styling */}
      <div className="flex-1 overflow-y-auto overscroll-behavior-y-contain relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 via-transparent to-indigo-500/10"></div>
        </div>

        <div className="relative px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3 sm:space-y-6">
          <div className="max-w-4xl w-full mx-auto flex flex-col gap-3 sm:gap-6">
            {hasMore && (
              <button 
                onClick={loadOlder} 
                className="self-center text-xs sm:text-sm text-purple-400 hover:text-purple-300 active:text-purple-500 underline py-2 px-4 rounded-xl hover:bg-slate-800/50 active:bg-slate-800/70 transition-all duration-200 border border-purple-500/20 bg-slate-900/30 backdrop-blur-sm touch-manipulation"
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
                  <div className="max-w-[90%] sm:max-w-[85%] lg:max-w-prose">
                    <div className="inline-block bg-gradient-to-r from-purple-600/90 via-indigo-600/90 to-purple-600/90 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl rounded-tr-lg text-sm sm:text-base whitespace-pre-wrap shadow-lg shadow-purple-500/20 break-words border border-purple-500/30 backdrop-blur-sm">
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

      {/* Enhanced Input Bar with Mobile Improvements */}
      <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-md border-t border-slate-700/50 shadow-2xl shadow-purple-500/5 safe-area-inset-bottom">
        <form onSubmit={handleSubmit} className="px-3 sm:px-6 py-2.5 sm:py-4">
          <div className="max-w-4xl mx-auto relative">
            {/* Autocomplete */}
            {showAutocomplete && (
              <SlashCommandAutocomplete 
                ref={autocompleteRef}
                query={inputValue}
                onSelect={(command) => {
                  setInputValue(`/${command} `);
                  setShowAutocomplete(false);
                  textareaRef.current?.focus();
                }}
                onKeyDown={(e) => {
                  // Handle escape in autocomplete
                  if (e.key === 'Escape') {
                    setShowAutocomplete(false);
                    textareaRef.current?.focus();
                  }
                }}
              />
            )}

            <div className="flex items-end gap-2 sm:gap-3 bg-gradient-to-r from-slate-800/60 to-slate-700/60 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-slate-600/40 backdrop-blur-sm shadow-lg shadow-purple-500/5">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask Labnex AI anything... (Type / for commands)"
                  className="w-full resize-none bg-transparent focus:outline-none text-slate-100 placeholder-slate-400 py-2 px-2.5 sm:px-3 rounded-lg sm:rounded-xl max-h-[100px] sm:max-h-[120px] text-sm sm:text-base leading-5 sm:leading-6"
                  style={{ minHeight: '40px', fontSize: '16px' }} // 16px prevents zoom on iOS
                />
                
                {/* Command indicator */}
                {inputValue.startsWith('/') && (
                  <div className="absolute right-2 top-2 text-xs text-purple-400 bg-purple-500/20 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-purple-500/30">
                    <CommandLineIcon className="h-3 w-3 inline mr-1" />
                    <span className="hidden sm:inline">Command</span>
                  </div>
                )}
              </div>
              
              {/* Voice Controls - Hidden on small screens when typing */}
              <div className={`${inputValue.trim() ? 'hidden sm:block' : 'block'}`}>
                <VoiceControls />
              </div>
              
              {/* Enhanced Send Button with Mobile Optimizations */}
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping || isScanning}
                className={`p-2.5 sm:p-3 ${hasError 
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:from-purple-800 active:to-indigo-800'
                } disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-xl transition-all duration-200 disabled:hover:scale-100 hover:scale-105 active:scale-95 shadow-lg shadow-purple-500/20 border border-purple-500/30 min-w-[44px] min-h-[44px] sm:min-w-[48px] sm:min-h-[48px] flex items-center justify-center touch-manipulation`}
                title={hasError ? "Retry sending message" : "Send message (Enter)"}
              >
                <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Mobile-optimized Input hints */}
            <div className="flex items-center justify-between mt-1.5 sm:mt-2 px-1 sm:px-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="hidden sm:inline">Press <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded border border-slate-600/50">Enter</kbd> to send</span>
                <span className="hidden md:inline">Press <kbd className="px-1.5 py-0.5 bg-slate-700/50 rounded border border-slate-600/50">Ctrl+Shift+V</kbd> for voice</span>
                <span className="sm:hidden text-purple-400/70">Tap send or press Enter</span>
              </div>
              <span className="text-purple-400/70 hidden xs:inline sm:hidden text-xs"><code>/</code> = cmd</span>
              <span className="text-purple-400/70 hidden sm:inline">Type <code>/</code> for commands</span>
            </div>
          </div>
        </form>
      </div>

      {/* Enhanced Mobile-specific styles and improvements */}
      <style>{`
        /* Mobile viewport optimizations */
        @media (max-width: 640px) {
          /* Prevent zoom on input focus for iOS */
          input, textarea, select {
            font-size: 16px !important;
          }
          
          /* Smooth animations for mobile */
          .animate-in {
            animation: slideInFromTop 0.2s ease-out;
          }
          
          /* Better touch targets */
          button, [role="button"] {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Improved scrolling */
          .overflow-y-auto {
            -webkit-overflow-scrolling: touch;
            overflow-scrolling: touch;
          }
          
          /* Remove iOS input styling */
          input, textarea {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            border-radius: 8px;
          }
        }
        
        /* Extra small screens (phones in portrait) */
        @media (max-width: 380px) {
          .max-w-\[90\%\] {
            max-width: 95% !important;
          }
          
          .px-3 {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          
          .gap-3 {
            gap: 8px !important;
          }
        }
        
        /* Landscape phone optimizations */
        @media (max-width: 896px) and (orientation: landscape) {
          .h-14 {
            height: 48px !important;
          }
          
          .py-3 {
            padding-top: 8px !important;
            padding-bottom: 8px !important;
          }
          
          .max-h-\[calc\(100vh-56px\)\] {
            max-height: calc(100vh - 48px) !important;
          }
        }
        
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Mobile touch improvements */
        @media (hover: none) and (pointer: coarse) {
          button:hover {
            background-color: inherit !important;
            transform: none !important;
          }
          
          button:active {
            transform: scale(0.95) !important;
            transition: transform 0.1s ease-in-out !important;
          }
          
          /* Remove hover effects on touch devices */
          .hover\:bg-slate-700\/50:hover {
            background-color: inherit !important;
          }
          
          .hover\:text-purple-300:hover {
            color: inherit !important;
          }
        }

        /* Safe area support for iOS */
        .safe-area-inset-bottom {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
        
        @supports (padding: max(0px)) {
          .safe-area-inset-bottom {
            padding-bottom: max(12px, env(safe-area-inset-bottom));
          }
        }

        /* Ensure full mobile coverage */
        @media (max-width: 640px) {
          body {
            padding: 0;
            margin: 0;
            overflow-x: hidden;
          }
          
          #root {
            padding: 0;
            margin: 0;
            max-width: 100vw;
            overflow-x: hidden;
          }
          
          /* Prevent horizontal scroll */
          * {
            max-width: 100%;
            box-sizing: border-box;
          }
        }

        /* High DPI displays */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
          .shadow-lg {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
                        0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          }
        }

        /* Focus improvements for accessibility */
        button:focus-visible, 
        textarea:focus-visible, 
        input:focus-visible {
          outline: 2px solid rgb(168 85 247);
          outline-offset: 2px;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Dark mode optimizations */
        @media (prefers-color-scheme: dark) {
          /* Already using dark theme, ensure consistency */
          meta[name="theme-color"] {
            content: "#0f172a";
          }
        }

        /* Mobile keyboard spacing */
        @media (max-width: 640px) {
          .mobile-keyboard-space {
            height: env(keyboard-inset-height, 0);
          }
        }
      `}</style>

      {/* Tutorial Component */}
      {showTutorial && (
        <AIChatTutorial
          onComplete={() => setShowTutorial(false)}
          onSkip={() => setShowTutorial(false)}
        />
      )}
    </div>
  );
};

export default LabnexAIPage; 