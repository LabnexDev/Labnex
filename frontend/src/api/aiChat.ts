import api from './axios';

export interface ChatContext {
  page?: string;
  projectId?: string;
  projectName?: string;
  [key: string]: any;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface AIChatResponse {
  reply: string;
  action?: { name: string; params: any };
}

export const aiChatApi = {
  sendMessage: async (message: string, context: ChatContext = {}): Promise<AIChatResponse> => {
    const response = await api.post('/ai/chat', { message, context });
    const data = response.data?.data || {};
    return {
      reply: data.reply || 'No response from AI.',
      action: data.action,
    };
  },
}; 