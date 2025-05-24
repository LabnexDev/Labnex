import axios from './axios';

const BASE_URL = '/integrations/discord'; // Base path for Discord integration API

export interface LinkDiscordAccountPayload {
    token: string;
}

export interface LinkDiscordAccountResponse {
    message: string;
    linkDetails?: { // Optional: backend might return more details on success
        labnexUserId: string;
        discordUserId: string;
        discordUsername: string;
    };
}

export const linkDiscordAccountApi = async (payload: LinkDiscordAccountPayload): Promise<LinkDiscordAccountResponse> => {
    try {
        const response = await axios.post<LinkDiscordAccountResponse>(`${BASE_URL}/link-account`, payload);
        return response.data;
    } catch (error: any) {
        console.error('Error linking Discord account:', error.response?.data || error.message);
        // Ensure a user-friendly message is thrown. The backend should provide this.
        throw new Error(error.response?.data?.message || 'Failed to link Discord account. Please try again.');
    }
};

// Interface for a single linked Discord account
export interface ILinkedDiscordAccount {
    _id: string; // Usually MongoDB ObjectId, but depends on what backend sends
    discordUserId: string;
    discordUsername: string;
    linkedAt: string; // Date string, might need formatting
}

// API to get linked Discord accounts
export const getLinkedDiscordAccountsApi = async (): Promise<ILinkedDiscordAccount[]> => {
    try {
        const response = await axios.get<ILinkedDiscordAccount[]>(`${BASE_URL}/linked-accounts`);
        return response.data;
    } catch (error: any) {
        console.error('Error fetching linked Discord accounts:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to fetch linked accounts.');
    }
};

// API to unlink a Discord account
export interface UnlinkDiscordAccountResponse {
    message: string;
}

export const unlinkDiscordAccountApi = async (discordUserIdToDelete: string): Promise<UnlinkDiscordAccountResponse> => {
    try {
        const response = await axios.delete<UnlinkDiscordAccountResponse>(`${BASE_URL}/unlink-account/${discordUserIdToDelete}`);
        return response.data;
    } catch (error: any) {
        console.error('Error unlinking Discord account:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Failed to unlink account.');
    }
}; 