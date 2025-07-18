import axios from './axios';

interface SupportRequestPayload {
  name: string;
  email: string;
  subject: string;
  message: string;
  category: 'technical' | 'billing' | 'feedback' | 'other';
}

export const sendSupportRequest = async (payload: SupportRequestPayload) => {
  const { data } = await axios.post('/support/contact', payload);
  return data;
}; 