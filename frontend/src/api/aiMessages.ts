import api from './axios';

export interface AIMessageDTO {
  _id: string;
  projectId?: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  action?: {
    type: string;
    params: any;
    status: string;
  };
}

export const aiMessagesApi = {
  fetchMessages: async (projectId?: string, page = 1, limit = 30): Promise<AIMessageDTO[]> => {
    const params: any = { page, limit };
    if (projectId) params.projectId = projectId;
    const res = await api.get('/ai/messages', { params });
    return res.data?.data || [];
  },
  saveMessage: async (payload: { projectId?: string; role: 'user' | 'assistant'; text: string; action?: any; }): Promise<AIMessageDTO> => {
    const res = await api.post('/ai/message', payload);
    return res.data?.data;
  },
}; 