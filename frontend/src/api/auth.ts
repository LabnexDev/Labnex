import axiosInstance from './axios';
import { AxiosError } from 'axios';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  name: string;
}

interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  token: string;
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('Making login request to:', '/auth/login');
    const { data } = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    console.log('Login response received:', { user: data.user, tokenLength: data.token?.length });
    return data;
  } catch (error) {
    console.error('Login request failed:', error);
    if (error instanceof AxiosError) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const register = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    console.log('Making register request to:', '/auth/register');
    const { data } = await axiosInstance.post<AuthResponse>('/auth/register', userData);
    console.log('Register response received:', { user: data.user, tokenLength: data.token?.length });
    return data;
  } catch (error) {
    console.error('Register request failed:', error);
    if (error instanceof AxiosError) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const getMe = async () => {
  try {
    console.log('Making getMe request to:', '/auth/me');
    const { data } = await axiosInstance.get('/auth/me');
    console.log('getMe response received:', data);
    return data;
  } catch (error) {
    console.error('getMe request failed:', error);
    if (error instanceof AxiosError) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
    }
    throw error;
  }
};

export const forgotPassword = async (email: string) => {
  try {
    await axiosInstance.post('/auth/forgot-password', { email });
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (payload: { token: string; id: string; password: string }) => {
  try {
    await axiosInstance.post('/auth/reset-password', payload);
  } catch (error) {
    throw error;
  }
}; 