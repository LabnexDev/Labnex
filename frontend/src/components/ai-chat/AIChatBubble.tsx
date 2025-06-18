import React from 'react';
import { useAIChat } from '../../contexts/AIChatContext';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const AIChatBubble: React.FC = () => {
  const { open, isOpen } = useAIChat();
  return (
    <button
      aria-label="Ask Labnex AI"
      onClick={open}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-4 rounded-full shadow-lg hover:shadow-2xl transform transition-all duration-200 ${isOpen ? 'scale-90 opacity-70' : 'scale-100'}`}
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Ask Labnex AI</span>
    </button>
  );
};

export default AIChatBubble; 