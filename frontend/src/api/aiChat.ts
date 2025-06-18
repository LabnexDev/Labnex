import api from './axios';

export interface ChatContext {
  page?: string;
  projectId?: string;
  projectName?: string;
  [key: string]: any;
}

export const aiChatApi = {
  sendMessage: async (message: string, context: ChatContext = {}): Promise<string> => {
    const response = await api.post('/ai/chat', { message, context });
    // Response format assumed: { success: boolean, data: { reply: string } }
    return response.data?.data?.reply || 'No response from AI.';
  },
}; 