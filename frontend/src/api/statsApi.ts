import axios from 'axios';

// Base URL for API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Fetch platform statistics
export const fetchPlatformStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stats/platform-stats`);
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to fetch platform stats');
    }
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    throw error;
  }
};

// Add a new waitlist entry
export const addWaitlistEntry = async (email: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/stats/waitlist`, { email });
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'Failed to add waitlist entry');
    }
  } catch (error) {
    console.error('Error adding waitlist entry:', error);
    throw error;
  }
};

// Fetch platform health
export const fetchPlatformHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    // The health endpoint directly returns the data object
    return response.data;
  } catch (error) {
    console.error('Error fetching platform health:', error);
    throw error; // Re-throw to be caught by React Query
  }
}; 