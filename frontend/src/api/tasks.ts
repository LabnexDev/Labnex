import axiosInstance from './axios';
import type { User } from '../types/auth'; // Corrected: IUser to User, added type keyword
import type { TestCase } from './testCases'; // Corrected: ITestCase to TestCase, added type keyword

export enum TaskStatus {
    TODO = 'To Do',
    IN_PROGRESS = 'In Progress',
    BLOCKED = 'Blocked',
    IN_REVIEW = 'In Review',
    DONE = 'Done',
    CANCELLED = 'Cancelled',
}

export enum TaskPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

// Interface for a Task object received from the API
export interface ITask {
    _id: string;
    taskReferenceId?: string;
    project: string | { _id: string; name: string }; // Can be populated
    title: string;
    description?: string;
    assignedTo?: User;
    createdBy: User;
    status: TaskStatus;
    priority: TaskPriority;
    testCases: TestCase[]; // Assuming populated test cases
    dueDate?: string; // Or Date
    createdAt: string;
    updatedAt: string;
}

// Payload for creating a new task
export interface CreateTaskPayload {
    title: string;
    description?: string;
    assignedTo?: string; // User ID
    priority?: TaskPriority;
    status?: TaskStatus;
    testCases?: string[]; // Array of TestCase IDs
    dueDate?: string; // ISO string or Date
}

// Payload for updating an existing task
export interface UpdateTaskPayload {
    title?: string;
    description?: string;
    assignedTo?: string | null; // User ID or null to unassign
    priority?: TaskPriority;
    status?: TaskStatus;
    testCases?: string[]; // Array of TestCase IDs
    dueDate?: string | null; // ISO string, Date, or null to clear
}

// API Service Functions

/**
 * Fetches tasks for a specific project.
 * @param projectId - The ID of the project.
 * @param filters - Optional query parameters for filtering (e.g., { status: 'TODO', priority: 'HIGH' }).
 * @param sortBy - Optional field to sort by.
 * @param sortOrder - Optional sort order ('asc' or 'desc').
 */
export const getTasksForProject = async (
    projectId: string,
    filters?: Record<string, string>,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<ITask[]> => {
    const params = { ...filters };
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await axiosInstance.get(`/projects/${projectId}/tasks`, { params });
    return response.data;
};

/**
 * Fetches a single task by its ID.
 * @param projectId - The ID of the project the task belongs to.
 * @param taskId - The ID of the task.
 */
export const getTaskById = async (projectId: string, taskId: string): Promise<ITask> => {
    const response = await axiosInstance.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
};

/**
 * Creates a new task for a project.
 * @param projectId - The ID of the project.
 * @param taskData - The data for the new task.
 */
export const createTask = async (projectId: string, taskData: CreateTaskPayload): Promise<ITask> => {
    const response = await axiosInstance.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
};

/**
 * Updates an existing task.
 * @param projectId - The ID of the project.
 * @param taskId - The ID of the task to update.
 * @param taskData - The data to update the task with.
 */
export const updateTask = async (projectId: string, taskId: string, taskData: UpdateTaskPayload): Promise<ITask> => {
    const response = await axiosInstance.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
};

/**
 * Deletes a task.
 * @param projectId - The ID of the project.
 * @param taskId - The ID of the task to delete.
 */
export const deleteTask = async (projectId: string, taskId: string): Promise<{ message: string }> => {
    const response = await axiosInstance.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
};

/**
 * Fetches tasks assigned to the current authenticated user.
 * @param filters - Optional query parameters for filtering (e.g., { projectId: 'someId', status: 'TODO', priority: 'HIGH' }).
 * @param sortBy - Optional field to sort by.
 * @param sortOrder - Optional sort order ('asc' or 'desc').
 */
export const getMyAssignedTasks = async (
    filters?: Record<string, string>,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
): Promise<ITask[]> => {
    const params = { ...filters };
    if (sortBy) params.sortBy = sortBy;
    if (sortOrder) params.sortOrder = sortOrder;

    const response = await axiosInstance.get('/tasks/my', { params });
    return response.data;
}; 