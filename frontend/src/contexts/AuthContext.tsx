import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axios';
import { SystemRoleType } from '../types/roles';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  emailNotifications: boolean;
  systemRole?: SystemRoleType | null;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const navigate = useNavigate();

  // Only check for token on initial mount, not on every auth change
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthProvider initialized, token exists:', !!token);
    
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Listen for storage changes (token removal by axios interceptor)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue === null && state.isAuthenticated) {
        console.log('Token removed from storage, updating auth state');
        setState(prev => ({
          ...prev,
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [state.isAuthenticated]);

  const fetchUser = async () => {
    try {
      console.log('Fetching user data...');
      const response = await axiosInstance.get<{ 
        success: boolean; 
        data: { 
          user: User
        } 
      }>('/auth/me');
      const token = localStorage.getItem('token');
      
      console.log('User data fetched successfully:', response.data.data.user);
      setState(prev => ({
        ...prev,
        user: response.data.data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      localStorage.removeItem('token');
      delete axiosInstance.defaults.headers.common['Authorization'];
      setState(prev => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }));
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('Starting login process...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await axiosInstance.post<{ 
        success: boolean; 
        data: { 
          user: User;
          token: string 
        }
      }>('/auth/login', credentials);
      const { user, token } = response.data.data;
      
      console.log('Login API successful, user:', user.email, 'Role:', user.systemRole);
      
      // Set token and headers first
      localStorage.setItem('token', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Update state
      setState(prev => ({
        ...prev,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
      
      console.log('Auth state updated, navigating to dashboard...');
      console.log('State after login:', { user: user.email, token: !!token, isAuthenticated: true });
      
      // Use setTimeout to ensure state update has been processed and React has re-rendered
      setTimeout(() => {
        console.log('Attempting navigation to dashboard...');
        navigate('/dashboard');
      }, 200);
      
    } catch (error: any) {
      console.error('Login failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'An error occurred during login',
      }));
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      console.log('Starting registration process...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await axiosInstance.post<{ 
        success: boolean; 
        data: { 
          user: User;
          token: string 
        } 
      }>('/auth/register', credentials);
      const { user, token } = response.data.data;

      console.log('Register API successful, user:', user.email, 'Role:', user.systemRole);
      
      localStorage.setItem('token', token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setState(prev => ({
        ...prev,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }));
      
      // Use setTimeout to ensure state update has been processed
      setTimeout(() => {
        navigate('/dashboard');
      }, 200);
      
    } catch (error: any) {
      console.error('Registration failed:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'An error occurred during registration',
      }));
      throw error;
    }
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setState({
      ...initialState,
      isLoading: false,
    });
    navigate('/login');
  };

  const value = {
    ...state,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 