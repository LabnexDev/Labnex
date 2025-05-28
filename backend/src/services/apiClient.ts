import axios from 'axios';

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://labnex-backend.onrender.com/api';

// Helper for logging
const log = (message: string, data?: any) => {
  console.log(`[AI API Client] ${message}`, data !== undefined ? data : '');
};

export const apiClient = {
  async interpretTestStep(step: string) {
    log('Sending step for interpretation:', { url: `${AI_API_BASE_URL}/interpret`, step });
    try {
      const response = await axios.post(`${AI_API_BASE_URL}/interpret`, { step });
      log('Received interpretation response:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      log('Error during step interpretation:', { error: error.message, step });
      return { success: false, error: error.message };
    }
  },

  async suggestAlternative(step: string) {
    log('Requesting alternative suggestion for step:', { url: `${AI_API_BASE_URL}/suggest`, step });
    try {
      const response = await axios.post(`${AI_API_BASE_URL}/suggest`, { step });
      log('Received suggestion response:', response.data);
      return { success: true, data: response.data };
    } catch (error: any) {
      log('Error during suggestion request:', { error: error.message, step });
      return { success: false, error: error.message };
    }
  }
}; 