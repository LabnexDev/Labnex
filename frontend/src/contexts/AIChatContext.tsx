import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiChatApi } from '../api/aiChat';
import type { ChatContext as AIChatBackendContext } from '../api/aiChat';
import { useLocation, useParams } from 'react-router-dom';
import { parseCommand } from '../utils/commandParser';
import { dispatchCommand } from '../utils/commandDispatcher';
import { aiMessagesApi } from '../api/aiMessages';

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

    // Persist user message
    aiMessagesApi.saveMessage({ projectId: pageContext.projectId as string | undefined, role: 'user', text: content }).catch(console.error);

    // Check for slash command
    if (content.startsWith('/')) {
      const parsed = parseCommand(content);
      if (!parsed) {
        const errorMsg: ChatMessage = {
          id: `${Date.now()}-e`,
          role: 'assistant',
          content: '❌ Unknown or malformed command',
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMsg]);
        // Persist assistant reply
        aiMessagesApi.saveMessage({ projectId: pageContext.projectId as string | undefined, role: 'assistant', text: errorMsg.content }).catch(console.error);
        return;
      }
      const resultText = await dispatchCommand(parsed, { ...pageContext, projectId: params.id || params.projectId });
      const resultMessage: ChatMessage = {
        id: `${Date.now()}-r`,
        role: 'assistant',
        content: resultText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, resultMessage]);
      // Persist assistant reply
      aiMessagesApi.saveMessage({ projectId: pageContext.projectId as string | undefined, role: 'assistant', text: resultText }).catch(console.error);
      return;
    }

    // Build simple context based on location and params
    const backendContext: AIChatBackendContext = {
      page: location.pathname,
      ...pageContext,
      history: messages.slice(-15).map(m => ({ role: m.role, content: m.content })),
    };
    if (params.id) backendContext.projectId = params.id;
    if (params.projectId) backendContext.projectId = params.projectId as string;

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
      // Persist assistant reply
      aiMessagesApi.saveMessage({ projectId: pageContext.projectId as string | undefined, role: 'assistant', text: reply }).catch(console.error);
    } catch (error: any) {
      const errorMessage: ChatMessage = {
        id: `${Date.now()}-e`,
        role: 'assistant',
        content: error?.message || 'Something went wrong.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Persist assistant reply
      aiMessagesApi.saveMessage({ projectId: pageContext.projectId as string | undefined, role: 'assistant', text: errorMessage.content }).catch(console.error);
      setIsScanning(false);
      setIsTyping(false);
    } finally {
      setIsScanning(false);
    }
  };

  // Load initial messages on mount or when project changes
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await aiMessagesApi.fetchMessages(pageContext.projectId as string | undefined);
        const transformed: ChatMessage[] = history.map(m => ({
          id: m._id,
          role: m.role,
          content: m.text,
          timestamp: new Date(m.timestamp).getTime(),
        }));
        setMessages(transformed);
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageContext.projectId]);

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