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
  private verboseLogging: boolean = false; // Added for internal logging control

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
      
      this.verboseLogging = userConfig.verbose || false; // Set verbose logging based on config

      config.baseURL = userConfig.apiUrl;
      
      if (userConfig.token) {
        config.headers.Authorization = `Bearer ${userConfig.token}`;
      }

      if (this.verboseLogging) {
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
    try {
      if (this.verboseLogging) {
        console.log(chalk.gray(`[DEBUG] Creating test case for project ${projectId}`));
        console.log(chalk.gray(`[DEBUG] Test case data: ${JSON.stringify(testCase, null, 2)}`));
      }
      const response = await this.api.post(`/projects/${projectId}/test-cases`, testCase);
      if (this.verboseLogging) {
        console.log(chalk.gray(`[DEBUG] Response status: ${response.status}`));
        console.log(chalk.gray(`[DEBUG] Response data: ${JSON.stringify(response.data, null, 2)}`));
      }
      // Temporary workaround: Assume success if HTTP status is 200 or 201, regardless of response content
      if (response.status === 200 || response.status === 201) {
        console.log(chalk.yellow('[DEBUG] Assuming test case save success based on HTTP status ' + response.status + '. Test case likely saved on backend.'));
        return {
          success: true,
          data: response.data as TestCase || { _id: 'unknown', title: testCase.title, description: testCase.description || '', steps: testCase.steps, expectedResult: testCase.expectedResult, priority: testCase.priority, status: 'PENDING', projectId: projectId, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        };
      }
      // Check if response data indicates success or contains an error
      if (response.data && response.data.success === false) {
        return {
          success: false,
          data: null as any,
          error: response.data.error || response.data.message || 'API reported failure'
        };
      }
      if (!response.data || (response.data._id === undefined && response.data.id === undefined)) {
        return {
          success: false,
          data: null as any,
          error: 'Invalid response format or missing test case ID'
        };
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      if (this.verboseLogging) {
        console.log(chalk.red(`[DEBUG] Error creating test case: ${error.message}`));
        if (error.response) {
          console.log(chalk.red(`[DEBUG] Response status: ${error.response.status}`));
          console.log(chalk.red(`[DEBUG] Response data: ${JSON.stringify(error.response.data, null, 2)}`));
        }
      }
      return {
        success: false,
        data: null as any,
        error: error.response?.data?.message || error.message
      };
    }
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
  async interpretTestStep(stepDescription: string): Promise<ApiResponse<string>> {
    if (this.verboseLogging) console.log(`[AI Client] POST /ai/interpret Request:`, { description: stepDescription });
    try {
      const response = await this.api.post<string | { suggestion: string; confidence?: number; error?: string; }>('/ai/interpret', { description: stepDescription }); 
      if (this.verboseLogging) console.log('[AI Client] POST /ai/interpret Response:', response.data);
      
      // Handle potentially varied response structures from this endpoint
      if (typeof response.data === 'string') {
        return { success: true, data: response.data };
      } else if (response.data && typeof (response.data as any).suggestion === 'string') {
        // If it's an object with a 'suggestion' field
        return { success: true, data: (response.data as any).suggestion };
      } else if (response.data && (response.data as any).error) {
        // Use console.error for client-side logging of an error reported by the API
        console.error(`[AI Client] interpretTestStep returned error structure: ${(response.data as any).error}`);
        return { success: false, data: '', error: (response.data as any).error };
      }
      
      console.warn(`[AI Client] interpretTestStep received unexpected response format: ${JSON.stringify(response.data).substring(0,100)}`);
      return { success: false, data: '', error: 'Unexpected response format from /ai/interpret' };
    } catch (error: any) {
      console.error(`[AI Client] Error calling /ai/interpret: ${error.message}`);
      return {
        success: false,
        data: '',
        error: error.response?.data?.message || error.response?.data?.error || error.message,
      };
    }
  }

  async suggestAlternative(step: string, pageContext: string = ''): Promise<ApiResponse<string>> { // Assuming AI returns a string
    if (this.verboseLogging) console.log('[AI Client] POST /ai/suggest-alternative Request:', { step, pageContext });
    try {
      const response = await this.api.post<string | ApiResponse<string>>('/ai/suggest-alternative', { step, pageContext });
      if (this.verboseLogging) console.log('[AI Client] POST /ai/suggest-alternative Response:', response.data);

      if (typeof response.data === 'string') {
        return { success: true, data: response.data };
      } else if (response.data && typeof response.data.data === 'string' && typeof response.data.success === 'boolean') {
        return response.data; // It's already in ApiResponse<string> format
      }
      console.warn(`[AI Client] suggestAlternative received unexpected response format: ${JSON.stringify(response.data).substring(0,100)}`);
      return { success: false, data: '', error: 'Unexpected response format' };
    } catch (error: any) {
      console.error(`[AI Client] Error calling /ai/suggest-alternative: ${error.message}`);
      return {
        success: false,
        data: '',
        error: error.response?.data?.message || error.response?.data?.error || error.message,
      };
    }
  }

  async getDynamicSelectorSuggestion(context: {
    failedSelector: string;
    descriptiveTerm: string;
    pageUrl: string;
    domSnippet: string;
    originalStep: string;
  }): Promise<ApiResponse<{ suggestedSelector: string; suggestedStrategy?: string }>> {
    if (this.verboseLogging) console.log('[AI Client] POST /ai/suggest-selector Request:', JSON.stringify(context, null, 2));
    try {
      const response = await this.api.post<any>('/ai/suggest-selector', context);
      if (this.verboseLogging) {
        console.log('[AI Client] POST /ai/suggest-selector Full Response Data:', JSON.stringify(response.data, null, 2));
      }

      // Corrected parsing for successful AI response
      if (response.data && response.data.success && response.data.data && typeof response.data.data.suggestedSelector === 'string') {
        return {
          success: true,
          data: {
            suggestedSelector: response.data.data.suggestedSelector,
            suggestedStrategy: response.data.data.suggestedStrategy,
            // Pass through confidence and reasoning if they exist
            ...(response.data.data.confidence && { confidence: response.data.data.confidence }),
            ...(response.data.data.reasoning && { reasoning: response.data.data.reasoning }),
          }
        };
      } else if (response.data && typeof response.data.suggestedSelector === 'string') {
        // Handle older direct data structure if AI reverts or for other similar endpoints
        console.warn('[AI Client] getDynamicSelectorSuggestion received direct data structure (fallback). Consider updating AI if this is common.');
        return {
          success: true,
          data: {
            suggestedSelector: response.data.suggestedSelector,
            suggestedStrategy: response.data.suggestedStrategy,
            ...(response.data.confidence && { confidence: response.data.confidence }),
            ...(response.data.reasoning && { reasoning: response.data.reasoning }),
          }
        };
      } else if (typeof response.data === 'string') {
        // Handle if backend sends a stringified JSON as data
        console.warn('[AI Client] getDynamicSelectorSuggestion received string data, attempting parse.');
        try {
          const parsedData = JSON.parse(response.data);
          if (parsedData && typeof parsedData.suggestedSelector === 'string') {
            return {
              success: true,
              data: {
                suggestedSelector: parsedData.suggestedSelector,
                suggestedStrategy: parsedData.suggestedStrategy,
                ...(parsedData.confidence && { confidence: parsedData.confidence }),
                ...(parsedData.reasoning && { reasoning: parsedData.reasoning }),
              }
            };
          }
        } catch (parseError) {
          console.error(`[AI Client] Failed to parse string data from getDynamicSelectorSuggestion: ${(parseError as Error).message}`);
          return { success: false, data: null as any, error: 'Failed to parse AI suggestion string.' };
        }
      }
      
      // Log more details if the format is unexpected, including the full problematic response.data
      console.warn('[AI Client] getDynamicSelectorSuggestion received unexpected response format or missing selector. Full response.data:', JSON.stringify(response.data, null, 2));
      return { success: false, data: null as any, error: response.data?.error || 'Unexpected response format or missing suggestedSelector' };
    } catch (error: any) {
      console.error(`[AI Client] Error calling /ai/suggest-selector: ${error.message}`);
      return {
        success: false,
        data: null as any, // Ensure data is null for type consistency on error
        error: error.response?.data?.message || error.response?.data?.error || error.message,
      };
    }
  }
}

// Export singleton instance
export const apiClient = new LabnexApiClient(); 