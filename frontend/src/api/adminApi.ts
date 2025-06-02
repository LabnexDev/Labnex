import axiosInstance from './axios';
import { SystemRoleType } from '../types/roles';

export interface WaitlistEntry {
  _id: string;
  email: string;
  createdAt: string; // Assuming it comes as an ISO string
}

export interface ApprovedUserData {
  id: string;
  name: string;
  email: string;
  systemRole: SystemRoleType;
  generatedPasswordInfo?: string; // As per backend controller
}

// Type for successful waitlist fetch
interface GetWaitlistSuccessResponse {
  success: true;
  data: WaitlistEntry[];
}

// Type for failed waitlist fetch (or other admin actions with a message)
interface AdminActionErrorResponse {
  success: false;
  message: string;
  data?: any; // Optional data field for some errors
}

/**
 * Fetches all waitlist entries.
 * Requires admin privileges.
 */
export const getWaitlistEntries = async (): Promise<WaitlistEntry[]> => {
  const response = await axiosInstance.get<GetWaitlistSuccessResponse | AdminActionErrorResponse>('/admin/waitlist');
  if (response.data.success) {
    return response.data.data;
  } else {
    // If success is false, it must be AdminActionErrorResponse
    throw new Error((response.data as AdminActionErrorResponse).message || 'Failed to fetch waitlist entries');
  }
};

// Type for successful approval
interface ApproveWaitlistSuccessResponse {
  success: true;
  message: string; // Backend sends a success message too
  data: ApprovedUserData;
}

/**
 * Approves a waitlist user, creating their account.
 * Requires admin privileges.
 * @param email The email of the user to approve.
 */
export const approveWaitlistUser = async (email: string): Promise<ApprovedUserData> => {
  const response = await axiosInstance.post<ApproveWaitlistSuccessResponse | AdminActionErrorResponse>(
    '/admin/waitlist/approve',
    { email }
  );
  if (response.data.success) {
    return response.data.data;
  } else {
    throw new Error((response.data as AdminActionErrorResponse).message || 'Failed to approve waitlist user');
  }
};

// Interfaces for User Engagement Statistics
export interface UserEngagementStat {
  id: string;
  name: string;
  email: string;
  createdAt: string; // ISO date string
  lastLoginAt?: string; // ISO date string, optional
  systemRole: SystemRoleType | null;
  projectsOwned: number;
  tasksCreated: number;
  testCasesCreated: number;
  notesCreated: number;
  snippetsCreated: number;
}

interface GetUserEngagementStatsSuccessResponse {
  success: true;
  data: UserEngagementStat[];
}

/**
 * Fetches user engagement statistics.
 * Requires admin privileges.
 */
export const getUserEngagementStats = async (): Promise<UserEngagementStat[]> => {
  const response = await axiosInstance.get<GetUserEngagementStatsSuccessResponse | AdminActionErrorResponse>(
    '/admin/user-engagement-stats'
  );
  if (response.data.success) {
    // Ensure data is UserEngagementStat[] before returning
    return (response.data as GetUserEngagementStatsSuccessResponse).data;
  } else {
    throw new Error((response.data as AdminActionErrorResponse).message || 'Failed to fetch user engagement stats');
  }
}; 