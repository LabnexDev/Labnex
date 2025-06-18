import React, { createContext, useContext, useState } from 'react';
import { aiChatApi } from '../api/aiChat';
import type { ChatContext as AIChatBackendContext } from '../api/aiChat';
import { useLocation, useParams } from 'react-router-dom';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatContextType {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  isScanning: boolean;
  pageContext: Record<string, any>;
  setPageContext: (ctx: Record<string, any>) => void;
  open: () => void;
  close: () => void;
  sendMessage: (content: string) => Promise<void>;
}

const AIChatContext = createContext<AIChatContextType | undefined>(undefined);

export const AIChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [pageContext, setPageContextState] = useState<Record<string, any>>({});

  const location = useLocation();
  const params = useParams();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const setPageContext = (ctx: Record<string, any>) => {
    setPageContextState(ctx);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Build simple context based on location and params
    const backendContext: AIChatBackendContext = {
      page: location.pathname,
      ...pageContext,
    };
    if (params.id) backendContext.projectId = params.id;
    if (params.projectId) backendContext.projectId = params.projectId as string;
    // Additional extraction can be added later.

    setIsScanning(true);
    setIsTyping(false);

    try {
      const reply = await aiChatApi.sendMessage(content, backendContext);
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-a`,
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      // Switch from scanning to typing indicator for a brief moment
      setIsScanning(false);
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1200);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-e`,
        role: 'assistant',
        content: error?.message || 'Something went wrong.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsScanning(false);
      setIsTyping(false);
    } finally {
      setIsScanning(false);
      setIsTyping(false);
    }
  };

  return (
    <AIChatContext.Provider value={{ messages, isOpen, isTyping, isScanning, pageContext, setPageContext, open, close, sendMessage }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = (): AIChatContextType => {
  const ctx = useContext(AIChatContext);
  if (!ctx) throw new Error('useAIChat must be used within an AIChatProvider');
  return ctx;
}; 