import axiosInstance from './axios';

export interface INote {
    _id: string;
    userId: string;
    discordUserId?: string; 
    content: string;
    project?: {
        _id: string;
        name: string;
    } | string; // project can be populated or just an ID string
    createdAt: string;
    updatedAt: string;
}

export interface CreateNotePayload {
    content: string;
    projectId?: string; // Optional: ID of the project to link
}

export interface UpdateNotePayload {
    content?: string;
    projectId?: string | null; // Optional: ID of the project to link, or null to unlink
}

export interface CreateNoteWithAIPayload {
    prompt: string;
    projectId?: string; // Optional: ID of the project to link
}

// Fetch all notes for the authenticated user (optionally filtered by project ID)
export const getNotes = async (projectId?: string): Promise<INote[]> => {
    const params = projectId ? { projectId } : {};
    const response = await axiosInstance.get('/notes', { params });
    return response.data;
};

// Create a new note
export const createNote = async (payload: CreateNotePayload): Promise<INote> => {
    const response = await axiosInstance.post('/notes', payload);
    return response.data;
};

// Update an existing note
export const updateNote = async (noteId: string, payload: UpdateNotePayload): Promise<INote> => {
    const response = await axiosInstance.put(`/notes/${noteId}`, payload);
    return response.data;
};

// Delete a note
export const deleteNote = async (noteId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/notes/${noteId}`);
    return response.data;
};

// Create a new note using AI
export const createNoteWithAI = async (payload: CreateNoteWithAIPayload): Promise<INote> => {
    const response = await axiosInstance.post('/notes/ai', payload);
    return response.data;
}; 