import axios from './axios'; // Assuming your centralized axios instance

const BASE_URL = '/bots'; // Corrected: /api is already in axiosInstance.baseURL

export interface BotStatusResponse {
    botId: string;
    status: 'running' | 'stopped' | 'starting' | 'error' | 'unknown';
    pid?: number;
    message?: string; // Optional messages from backend
    startTime?: number; // Added: Timestamp of when the bot started
    uptime?: number;    // Added: Uptime in milliseconds
    messagesSent: number;    // Now always present
    messagesReceived: number; // Now always present
}

export interface BotActionResponse {
    message: string;
    botId: string;
    startTime?: number; // Added: Timestamp of when the bot started, returned by startBot endpoint
}

export const getBotStatus = async (botId: string): Promise<BotStatusResponse> => {
    try {
        const response = await axios.get<BotStatusResponse>(`${BASE_URL}/${botId}/status`);
        return response.data;
    } catch (error: any) {
        console.error(`Error fetching status for bot ${botId}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || `Failed to fetch status for ${botId}`);
    }
};

export const startBot = async (botId: string): Promise<BotActionResponse> => {
    try {
        const response = await axios.post<BotActionResponse>(`${BASE_URL}/${botId}/start`);
        return response.data;
    } catch (error: any) {
        console.error(`Error starting bot ${botId}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || `Failed to start ${botId}`);
    }
};

export const stopBot = async (botId: string): Promise<BotActionResponse> => {
    try {
        const response = await axios.post<BotActionResponse>(`${BASE_URL}/${botId}/stop`);
        return response.data;
    } catch (error: any) {
        console.error(`Error stopping bot ${botId}:`, error.response?.data || error.message);
        throw new Error(error.response?.data?.message || `Failed to stop ${botId}`);
    }
}; 