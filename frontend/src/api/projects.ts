import axios from './axios';

export interface TestCase {
  _id: string;
  taskReferenceId?: string;
  name: string;
  status: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  projectCode: string;
  description: string;
  isActive: boolean;
  testCaseCount: number;
  memberCount: number;
  isOwner: boolean;
  recentTestCases: TestCase[];
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectHealth {
  activePercentage: number;
  averageTestCasesPerProject: number;
  averageTeamSize: number;
}

export interface DashboardData {
  totalProjects: number;
  activeProjects: number;
  totalTestCases: number;
  totalTeamMembers: number;
  recentlyUpdatedProjects: Array<Project & {
    recentActivity: TestCase[];
  }>;
  projectHealth: ProjectHealth;
}

export interface CreateProjectData {
  name: string;
  projectCode: string;
  description?: string;
}

export const getDashboardData = async (): Promise<DashboardData> => {
  const { data } = await axios.get<DashboardData>('/projects/dashboard');
  return data;
};

export const getProjects = async (): Promise<Project[]> => {
  const { data } = await axios.get<Project[]>('/projects');
  return data;
};

export const getProject = async (id: string): Promise<Project> => {
  const { data } = await axios.get<Project>(`/projects/${id}`);
  return data;
};

export const createProject = async (projectData: CreateProjectData): Promise<Project> => {
  console.log('Creating project with data:', projectData);
  const { data } = await axios.post<Project>('/projects', projectData);
  return data;
};

export const updateProject = async (id: string, projectData: Partial<CreateProjectData>): Promise<Project> => {
  const { data } = await axios.put<Project>(`/projects/${id}`, projectData);
  return data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await axios.delete(`/projects/${id}`);
}; 