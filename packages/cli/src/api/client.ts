import axios, { AxiosInstance, AxiosResponse } from 'axios';
import chalk from 'chalk';
import { loadConfig } from '../utils/config';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Project {
  _id: string;
  name: string;
  projectCode: string;
  description?: string;
  isActive: boolean;
  testCaseCount: number;
  taskCount: number;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  members: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  _id: string;
  title: string;
  description?: string;
  steps: string[];
  expectedResult: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'PASSED' | 'FAILED';
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestRun {
  _id: string;
  projectId: string;
  testCases: string[];
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  results: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  config: {
    parallel: number;
    environment: string;
    aiOptimization: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export class LabnexApiClient {
  private api: AxiosInstance;
  private token?: string;

  constructor() {
    this.api = axios.create({
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(async (config) => {
      const userConfig = await loadConfig();
      
      config.baseURL = userConfig.apiUrl;
      
      if (userConfig.token) {
        config.headers.Authorization = `Bearer ${userConfig.token}`;
      }

      if (userConfig.verbose) {
        console.log(chalk.gray(`→ ${config.method?.toUpperCase()} ${config.url}`));
      }

      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          console.error(chalk.red('Authentication failed. Please run: labnex auth login'));
          process.exit(1);
        }
        
        if (error.response?.status >= 500) {
          console.error(chalk.red('Server error. Please try again later.'));
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await this.api.post('/auth/login', { email, password });
    
    // Handle both old and new response formats
    if (response.data.success) {
      // New format: { success: true, data: { user, token } }
      return response.data;
    } else if (response.data.user && response.data.token) {
      // Old format: { user, token }
      return {
        success: true,
        data: {
          user: response.data.user,
          token: response.data.token
        }
      };
        } else {      return {        success: false,        data: null as any,        error: 'Invalid response format'      };    }
  }

  async me(): Promise<ApiResponse<{ user: any }>> {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  // Projects
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response = await this.api.get('/projects');
      // Backend returns projects directly, not wrapped in success/data format
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || error.message
      };
    }
  }

  async getProject(projectId: string): Promise<ApiResponse<Project>> {
    try {
      const response = await this.api.get(`/projects/${projectId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.message || error.message
      };
    }
  }

  async createProject(project: {    name: string;    projectCode: string;    description?: string;  }): Promise<ApiResponse<Project>> {    const response = await this.api.post('/projects', project);    return {      success: true,      data: response.data    };  }

  // Test Cases
  async getTestCases(projectId: string): Promise<ApiResponse<TestCase[]>> {
    try {
      const response = await this.api.get(`/projects/${projectId}/test-cases`);
      // Assuming response.data is the array of TestCase objects, wrap it
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || error.message
      };
    }
  }

  async createTestCase(projectId: string, testCase: {
    title: string;
    description?: string;
    steps: string[];
    expectedResult: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }): Promise<ApiResponse<TestCase>> {
    const response = await this.api.post(`/projects/${projectId}/test-cases`, testCase);
    return response.data;
  }

  // Test Runs
  async createTestRun(projectId: string, config: {
    testCases?: string[];
    parallel?: number;
    environment?: string;
    aiOptimization?: boolean;
  }): Promise<ApiResponse<TestRun>> {
    const response = await this.api.post(`/projects/${projectId}/test-runs`, config);
    return response.data;
  }

  async getTestRun(runId: string): Promise<ApiResponse<TestRun>> {
    const response = await this.api.get(`/test-runs/${runId}`);
    return response.data;
  }

  async getTestRunResults(runId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get(`/test-runs/${runId}/results`);
    return response.data;
  }

  // AI Features
  async generateTestCase(description: string): Promise<ApiResponse<{
    title: string;
    description: string;
    steps: string[];
    expectedResult: string;
  }>> {
    const response = await this.api.post('/ai/generate-test-case', { description });
    return response.data;
  }

  async optimizeTestSuite(projectId: string, codeChanges?: string[]): Promise<ApiResponse<{
    selectedTests: string[];
    reasoning: string;
  }>> {
    const response = await this.api.post(`/ai/optimize-test-suite/${projectId}`, { codeChanges });
    return response.data;
  }

  async analyzeFailure(testRunId: string, failureId: string): Promise<ApiResponse<{
    analysis: string;
    suggestions: string[];
  }>> {
    const response = await this.api.post(`/ai/analyze-failure/${testRunId}/${failureId}`);
    return response.data;
  }

  // New AI methods for step interpretation and suggestion
  async interpretTestStep(step: string): Promise<ApiResponse<string>> { // Assuming AI returns a string
    try {
      const response = await this.api.post('/api/ai/interpret', { step });
      // The backend's aiController wraps the actual AI response in a { success: true, data: aiResponse.data } structure.
      // We need to align with how other methods in this client handle responses.
      // If response.data from axios already contains our { success, data } structure, we use it directly.
      // Otherwise, we might need to access response.data.data if the AI service itself returns a simple string.
      if (response.data && typeof response.data.data === 'string') { // Check if backend returned data as expected
        return { success: true, data: response.data.data };
      }
      // Fallback or if AI directly returns a string and backend forwards it without wrapping
      if (typeof response.data === 'string') { 
        return { success: true, data: response.data };
      } 
      // If the structure is unexpected, or aiController itself returns { success: false, error: ...}
      if (response.data && response.data.success === false) {
        return { success: false, data: null as any, error: response.data.error || 'AI interpretation failed with unspecified error' };
      }
      // Default error if response structure is completely off
      return { success: false, data: null as any, error: 'AI interpretation failed or returned unexpected format' };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error during step interpretation'
      };
    }
  }

  async suggestAlternative(step: string): Promise<ApiResponse<string>> { // Assuming AI returns a string
    try {
      const response = await this.api.post('/api/ai/suggest', { step });
      if (response.data && typeof response.data.data === 'string') { // Check if backend returned data as expected
        return { success: true, data: response.data.data };
      }
      if (typeof response.data === 'string') { 
        return { success: true, data: response.data };
      } 
      if (response.data && response.data.success === false) {
        return { success: false, data: null as any, error: response.data.error || 'AI suggestion failed with unspecified error' };
      }
      return { success: false, data: null as any, error: 'AI suggestion failed or returned unexpected format' };
    } catch (error: any) {
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error during suggestion request'
      };
    }
  }
}

// Export singleton instance
export const apiClient = new LabnexApiClient(); 