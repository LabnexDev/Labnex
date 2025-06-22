import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiChatApi } from '../api/aiChat';
import type { ChatContext as AIChatBackendContext } from '../api/aiChat';
import { useLocation, useParams } from 'react-router-dom';
import { aiMessagesApi } from '../api/aiMessages';
import { aiSessionsApi } from '../api/aiSessions';
import { useOpenAITTS } from '../hooks/useOpenAITTS';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatContextType {
  messages: ChatMessage[];
  sessions: { id: string; title: string }[];
  currentSessionId: string | null;
  createNewSession: () => Promise<void>;
  switchSession: (id: string) => void;
  hasMore: boolean;
  loadOlder: () => Promise<void>;
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
  const [sessions, setSessions] = useState<{ id: string; title: string }[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [pageContext, setPageContextState] = useState<Record<string, any>>({});
  const [pageNum, setPageNum] = useState(1);
  const limit = 30;
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { speak } = useOpenAITTS();

  const location = useLocation();
  const params = useParams();

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const setPageContext = (ctx: Record<string, any>) => {
    setPageContextState(ctx);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isSending) return;

    setIsSending(true);

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    if (currentSessionId) {
      try {
        await aiMessagesApi.saveMessage({
          projectId: pageContext.projectId as string | undefined,
          sessionId: currentSessionId,
          role: 'user',
          text: content
        });
      } catch (error) {
        console.error('Failed to persist user message:', error);
      }
    }

    try {
      const backendContext: AIChatBackendContext = {
        page: location.pathname,
        ...pageContext,
        history: messages.slice(-15).map(m => ({ role: m.role, content: m.content })),
        sessionId: currentSessionId!,
      };
      if (params.id) backendContext.projectId = params.id;
      if (params.projectId) backendContext.projectId = params.projectId as string;

      setIsScanning(true);
      setIsTyping(false);

      try {
        const { reply, action } = await aiChatApi.sendMessage(content, backendContext);

        if (!reply) {
          throw new Error('No response received from AI service');
        }

        const assistantMessage: ChatMessage = {
          id: `${Date.now()}-a`,
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (currentSessionId) {
          try {
            await aiMessagesApi.saveMessage({
              projectId: pageContext.projectId as string | undefined,
              sessionId: currentSessionId,
              role: 'assistant',
              text: reply
            });
          } catch (error) {
            console.error('Failed to persist AI response:', error);
          }
        }

        speak(reply);

        setIsScanning(false);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 1200);

        if (action) {
          console.warn('Received an action but dispatcher is disabled:', action);
        }
      } catch (apiError: any) {
        console.error('AI Chat API error:', apiError);

        let errorContent = 'I apologize, but I encountered an issue. Please try again.';

        const anyApiError = apiError as any;
        if (anyApiError.code === 'ECONNABORTED' || anyApiError.message?.includes('timeout')) {
          errorContent = 'Request timed out. The AI service may be busy. Please try again.';
        } else if (anyApiError.response?.status === 429) {
          errorContent = 'Too many requests. Please wait a moment before trying again.';
        } else if (anyApiError.response?.status === 503) {
          errorContent = 'AI service temporarily unavailable. Please try again shortly.';
        } else if (anyApiError.response?.status >= 500) {
          errorContent = 'Internal server error. Please try again or contact support if the issue persists.';
        } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
          errorContent = 'No internet connection. Please check your network and try again.';
        }

        const errorMessage: ChatMessage = {
          id: `${Date.now()}-e`,
          role: 'assistant',
          content: errorContent,
          timestamp: Date.now(),
        };
        setMessages(prev => [...prev, errorMessage]);

        if (currentSessionId) {
          try {
            await aiMessagesApi.saveMessage({
              projectId: pageContext.projectId as string | undefined,
              sessionId: currentSessionId,
              role: 'assistant',
              text: errorContent
            });
          } catch (error) {
            console.error('Failed to persist error message:', error);
          }
        }
      }
    } finally {
      setIsScanning(false);
      setIsTyping(false);
      setIsSending(false);
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      if (!currentSessionId) return;
      try {
        const history = await aiMessagesApi.fetchMessages(undefined, 1, limit, currentSessionId);
        const transformed: ChatMessage[] = history.map(m => ({
          id: m._id,
          role: m.role,
          content: m.text,
          timestamp: new Date(m.timestamp).getTime(),
        }));
        setMessages(transformed.reverse());
        setHasMore(history.length === limit);
        setPageNum(1);
      } catch (e) {
        console.error('Failed to load chat history', e);
      }
    };
    if(isOpen) {
        loadHistory();
    }
  }, [currentSessionId, isOpen]);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const list = await aiSessionsApi.listSessions(pageContext.projectId as string | undefined);
        setSessions(list.map(s => ({ id: s._id, title: s.title })));
        if (list.length > 0) {
          if (!currentSessionId || !list.find(s => s._id === currentSessionId)) {
            setCurrentSessionId(list[0]._id);
          }
        } else {
            createNewSession();
        }
      } catch (e) { console.error('loadSessions', e); }
    };
    if (isOpen) {
        loadSessions();
    }
  }, [pageContext.projectId, isOpen]);

  const createNewSession = async () => {
    try {
        const newSession = await aiSessionsApi.createSession(pageContext.projectId as string | undefined);
        setSessions(prev => [{ id: newSession._id, title: newSession.title }, ...prev]);
        setCurrentSessionId(newSession._id);
        setMessages([]);
        setHasMore(true);
        setPageNum(1);
    } catch(e) {
        console.error("Failed to create new session", e)
    }
  };

  const switchSession = (id: string) => {
    setCurrentSessionId(id);
    setMessages([]);
    setHasMore(true);
    setPageNum(1);
  };

  const loadOlder = async () => {
    if (!hasMore || !currentSessionId) return;
    const nextPage = pageNum + 1;
    try {
      const older = await aiMessagesApi.fetchMessages(undefined, nextPage, limit, currentSessionId);
      const transformed: ChatMessage[] = older.map(m => ({ id: m._id, role: m.role, content: m.text, timestamp: new Date(m.timestamp).getTime() }));
      setMessages(prev => [...transformed.reverse(), ...prev]);
      setPageNum(nextPage);
      if (older.length < limit) setHasMore(false);
    } catch (e) { console.error('loadOlder', e); }
  };

  return (
    <AIChatContext.Provider value={{ messages, sessions, currentSessionId, createNewSession, switchSession, hasMore, loadOlder, isOpen, isTyping, isScanning, pageContext, setPageContext, open, close, sendMessage }}>
      {children}
    </AIChatContext.Provider>
  );
};

export const useAIChat = (): AIChatContextType => {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error('useAIChat must be used within an AIChatProvider');
  }
  return context;
}; 