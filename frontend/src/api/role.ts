import axiosInstance from './axios';

export const searchUsers = async (query: string) => {
  try {
    console.log('Searching users with query:', query);
    const response = await axiosInstance.get(`/roles/search?query=${encodeURIComponent(query)}`);
    console.log('Search response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};

export const assignRole = async (data: { userId: string; projectId: string; roleType: string }) => {
  try {
    console.log('Assigning role:', data);
    const response = await axiosInstance.post('/roles/assign', data);
    console.log('Assign role response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error assigning role:', error);
    throw error;
  }
};

export const getProjectRoles = async (projectId: string) => {
  try {
    console.log('Getting project roles:', projectId);
    const response = await axiosInstance.get(`/roles/project/${projectId}`);
    console.log('Get project roles response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting project roles:', error);
    throw error;
  }
};

export const removeRole = async (projectId: string, userId: string) => {
  try {
    console.log('Removing role:', { projectId, userId });
    const response = await axiosInstance.delete(`/roles/project/${projectId}/user/${userId}`);
    console.log('Remove role response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error removing role:', error);
    throw error;
  }
}; 