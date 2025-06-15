import axios from './axios';
import axiosInstance from './axios';

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  emailNotifications: boolean;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface UpdatePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationPreferencesData {
  emailNotifications: boolean;
}

// Search users
export const searchUsers = async (query: string): Promise<User[]> => {
  const response = await axios.get(`/users/search?query=${encodeURIComponent(query)}`);
  return response.data;
};

// Update user profile
export const updateProfile = async (data: UpdateProfileData) => {
  const response = await axiosInstance.put<{ user: User }>('/users/profile', data);
  return response.data;
};

// Update password
export const updatePassword = async (data: UpdatePasswordData) => {
  const response = await axiosInstance.put<{ message: string }>('/users/password', data);
  return response.data;
};

// Update notification preferences
export const updateNotificationPreferences = async (data: UpdateNotificationPreferencesData) => {
  const response = await axiosInstance.put<{ user: User }>('/users/notifications', data);
  return response.data;
};

// Delete own account
export const deleteMyAccount = async (password: string): Promise<{ message: string }> => {
  const response = await axiosInstance.delete<{ message: string }>('/users/me', {
    data: { currentPassword: password }, // Send password in the data property for DELETE requests
  });
  return response.data;
};

// Types for API Keys
export interface ApiKey {
  _id: string;
  label: string;
  prefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface NewApiKeyResponse {
  token: string;
  apiKey: ApiKey;
}

/**
 * Fetches all API keys for the current user.
 */
export const getApiKeys = async (): Promise<ApiKey[]> => {
  const response = await axios.get('/api-keys');
  return response.data;
};

/**
 * Creates a new API key.
 * @param label A descriptive label for the key.
 */
export const createApiKey = async (label: string): Promise<NewApiKeyResponse> => {
  const response = await axios.post('/api-keys', { label });
  return response.data;
};

/**
 * Revokes (deletes) an API key.
 * @param keyId The ID of the key to revoke.
 */
export const revokeApiKey = async (keyId: string): Promise<{ message: string }> => {
  const response = await axios.delete(`/api-keys/${keyId}`);
  return response.data;
}; 