import axios from './axios';
import { RoleType } from '../types/role';
import type { User } from '../types/role';

export interface Role {
  _id: string;
  type: RoleType;
  projectId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssignRoleData {
  userId: string;
  projectId: string;
  roleType: RoleType;
}

// Search users by email or name
export const searchUsers = async (query: string): Promise<User[]> => {
  try {
    console.log('Searching users with query:', query);
    const response = await axios.get(`/roles/search?query=${encodeURIComponent(query)}`);
    console.log('Search response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error searching users:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to search users');
  }
};

// Get all roles for a project
export const getProjectRoles = async (projectId: string): Promise<Role[]> => {
  try {
    const response = await axios.get(`/roles/project/${projectId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting project roles:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get project roles');
  }
};

// Get user's role for a project
export const getUserRole = async (projectId: string): Promise<Role> => {
  try {
    const response = await axios.get(`/roles/project/${projectId}/user`);
    return response.data;
  } catch (error: any) {
    console.error('Error getting user role:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to get user role');
  }
};

// Assign role to user
export const assignRole = async (data: AssignRoleData): Promise<Role> => {
  try {
    const response = await axios.post('/roles/assign', data);
    return response.data;
  } catch (error: any) {
    console.error('Error assigning role:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to assign role');
  }
};

// Remove role from user
export const removeRole = async (projectId: string, userId: string): Promise<void> => {
  try {
    await axios.delete(`/roles/project/${projectId}/user/${userId}`);
  } catch (error: any) {
    console.error('Error removing role:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to remove role');
  }
}; 