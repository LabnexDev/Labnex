import axiosInstance from './axios';
import type { Project } from './projects'; // For populated project type

export interface ICodeSnippet {
    _id: string;
    userId: string;
    projectId?: Project | string; // Changed from project to projectId
    title: string;
    description?: string;
    language: string;
    code: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSnippetPayload {
    title: string;
    description?: string;
    language: string;
    code: string;
    projectId?: string; 
}

export interface UpdateSnippetPayload {
    title?: string;
    description?: string;
    language?: string;
    code?: string;
    projectId?: string | null; // null to unlink
}

export interface AISuggestionPayload {
    action: 'cleanup' | 'fix_errors';
}

export interface AISuggestionResponse {
    suggestion: string;
}

// Create a new snippet
export const createSnippet = async (payload: CreateSnippetPayload): Promise<ICodeSnippet> => {
    const response = await axiosInstance.post('/snippets', payload);
    return response.data;
};

// Get all snippets for the user (optionally filtered by project)
export const getSnippets = async (projectId?: string): Promise<ICodeSnippet[]> => {
    const params = projectId ? { projectId } : {};
    const response = await axiosInstance.get('/snippets', { params });
    return response.data;
};

// Get a single snippet by ID
export const getSnippetById = async (snippetId: string): Promise<ICodeSnippet> => {
    const response = await axiosInstance.get(`/snippets/${snippetId}`);
    return response.data;
};

// Update an existing snippet
export const updateSnippet = async (snippetId: string, payload: UpdateSnippetPayload): Promise<ICodeSnippet> => {
    const response = await axiosInstance.put(`/snippets/${snippetId}`, payload);
    return response.data;
};

// Delete a snippet
export const deleteSnippet = async (snippetId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/snippets/${snippetId}`);
    return response.data;
};

// Get AI assistance for a snippet
export const getAISuggestion = async (snippetId: string, payload: AISuggestionPayload): Promise<AISuggestionResponse> => {
    const response = await axiosInstance.post(`/snippets/${snippetId}/assist`, payload);
    return response.data;
}; 