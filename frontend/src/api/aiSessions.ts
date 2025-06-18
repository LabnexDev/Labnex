import api from './axios';

export interface AISessionDTO {
  _id: string;
  projectId?: string;
  userId: string;
  title: string;
  createdAt: string;
}

export const aiSessionsApi = {
  listSessions: async (projectId?: string): Promise<AISessionDTO[]> => {
    const params: any = {};
    if (projectId) params.projectId = projectId;
    const res = await api.get('/ai/sessions', { params });
    return res.data?.data || [];
  },
  createSession: async (projectId?: string, title?: string): Promise<AISessionDTO> => {
    const res = await api.post('/ai/session', { projectId, title });
    return res.data?.data;
  },
  deleteSession: async (id: string): Promise<void> => {
    await api.delete(`/ai/session/${id}`);
  },
}; 