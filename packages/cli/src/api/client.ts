import axios, { AxiosInstance, AxiosResponse } from 'axios';
import chalk from 'chalk';
import { loadConfig } from '../utils/config';
import Table from 'cli-table3';

export interface ApiResponse<T = unknown> {
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
  private verboseLogging = false;

  constructor() {
    this.api = axios.create({
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(async (config) => {
      const userConfig = await loadConfig();
      
      // Verbose if set in config OR via global env flag (e.g. --verbose passed to CLI)
      this.verboseLogging = process.env.LABNEX_VERBOSE === 'true' || userConfig.verbose || false;

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

  public setVerbose(verbose: boolean): void {
    this.verboseLogging = verbose;
  }

  /**
   * Allow commands to turn on verbose logging after the client has been constructed.
   * (Helpful for sub-commands that parse --verbose themselves.)
   */
  public enableVerbose(): void {
    this.verboseLogging = true;
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: unknown; token: string }>> {
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
    } else {
      return {
        success: false,
        data: { user: null, token: '' },
        error: 'Invalid response format'
      };
    }
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
    } catch (error: unknown) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
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
    } catch (error: unknown) {
      return {
        success: false,
        data: {
          _id: '',
          name: '',
          projectCode: '',
          description: '',
          isActive: false,
          testCaseCount: 0,
          taskCount: 0,
          owner: {
            _id: '',
            name: '',
            email: ''
          },
          members: [],
          createdAt: '',
          updatedAt: ''
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async displayProjectDetails(project: Project) {
    console.log(chalk.cyan(`\n📁 ${project.name} (${project.projectCode})`));
    console.log(chalk.gray('─'.repeat(50)));
    
    console.log(`${chalk.bold('Description:')} ${project.description || 'No description'}`);
    console.log(`${chalk.bold('Status:')} ${project.isActive ? chalk.green('Active') : chalk.gray('Inactive')}`);
    console.log(`${chalk.bold('Owner:')} ${project.owner.name} (${project.owner.email})`);
    console.log(`${chalk.bold('Created:')} ${new Date(project.createdAt).toLocaleDateString()}`);
    console.log(`${chalk.bold('Updated:')} ${new Date(project.updatedAt).toLocaleDateString()}`);
    
    console.log(`\n${chalk.bold('Statistics:')}`);
    console.log(`  Test Cases: ${chalk.cyan(project.testCaseCount)}`);
    console.log(`  Tasks: ${chalk.cyan(project.taskCount)}`);
    console.log(`  Team Members: ${chalk.cyan(project.members.length)}`);

    if (project.members.length > 0) {
      console.log(`\n${chalk.bold('Team Members:')}`);
      const membersTable = new Table({
        head: ['Name', 'Email', 'Role'],
        colWidths: [20, 30, 15]
      });

      project.members.forEach((member: any) => {
        membersTable.push([
          member.name,
          member.email,
          member.role
        ]);
      });

      console.log(membersTable.toString());
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
    } catch (error: unknown) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error'
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
          data: null as unknown as TestCase,
          error: response.data.error || response.data.message || 'API reported failure'
        };
      }
      if (!response.data || (response.data._id === undefined && response.data.id === undefined)) {
        return {
          success: false,
          data: null as unknown as TestCase,
          error: 'Invalid response format or missing test case ID'
        };
      }
      return {
        success: true,
        data: response.data
      };
    } catch (error: unknown) {
      if (this.verboseLogging) {
        if (error instanceof Error) {
          let errorMessage = error.message;
          if ((error as any).response?.data) {
            errorMessage += `\n${JSON.stringify((error as any).response.data)}`;
          }
          console.log(chalk.red(`[DEBUG] Error creating test case: ${errorMessage}`));
        } else {
          console.log(chalk.red(`[DEBUG] Unknown error creating test case: ${error}`));
        }
      }
      return {
        success: false,
        data: null as unknown as TestCase,
        error: error instanceof Error ? error.message : 'Unknown error during test case creation'
      };
    }
  }


  // Test Runs
  async createTestRun(projectId: string, config: {
    testCases?: string[];
    parallel?: number;
    environment?: string;
    aiOptimization?: boolean;
    baseUrl?: string;
    useCloudRunner?: boolean;
    credentials?: { username?: string; password?: string };
  }): Promise<ApiResponse<TestRun>> {
    const response = await this.api.post(`/projects/${projectId}/test-runs`, config);
    return response.data;
  }

  async getTestRun(runId: string): Promise<ApiResponse<TestRun>> {
    const response = await this.api.get(`/test-runs/${runId}`);
    return response.data;
  }

  async getTestRunResults(runId: string): Promise<ApiResponse<{ total: number; passed: number; failed: number; duration: number; }>> {
    const response = await this.api.get(`/test-runs/${runId}/results`);
    return response.data;
  }

  // Test Runs list for a project
  async getTestRuns(projectId: string): Promise<ApiResponse<TestRun[]>> {
    const candidatePaths = [
      `/projects/${projectId}/runs`,
      `/projects/${projectId}/test-runs`, // alt pattern
      { path: '/runs', params: { projectId } }, // query param style
      { path: '/test-runs', params: { projectId } }
    ];

    for (const c of candidatePaths) {
      try {
        const res =
          typeof c === 'string'
            ? await this.api.get(c)
            : await this.api.get(c.path, { params: c.params });
        const possibleArray = Array.isArray(res.data)
          ? res.data
          : (res.data && res.data.success && Array.isArray(res.data.data) ? res.data.data : null);

        if (possibleArray !== null) {
          return { success: true, data: possibleArray };
        }
      } catch (e: any) {
        if (e.response?.status !== 404) {
          // Non-404 error, stop trying further
          return {
            success: false,
            data: [],
            error: e instanceof Error ? e.message : 'Unknown error'
          };
        }
        // else continue to next pattern
      }
    }
    return { success: false, data: [], error: 'Runs endpoint not found (tried multiple variants)' };
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
    if (this.verboseLogging) {
      console.log(chalk.gray(`[DEBUG] Optimizing test suite for project ${projectId}`));
      console.log(chalk.gray(`[DEBUG] Payload: ${JSON.stringify({ codeChanges }, null, 2)}`));
    }
    const response = await this.api.post(`/ai/optimize-test-suite/${projectId}`, { codeChanges });
    if (this.verboseLogging) {
      console.log(chalk.gray(`[DEBUG] Response status: ${response.status}`));
      console.log(chalk.gray(`[DEBUG] Response data: ${JSON.stringify(response.data, null, 2)}`));
    }
    return response.data;
  }

  // Failure Analysis
  async analyzeFailure(testRunId: string, failureId: string): Promise<ApiResponse<{ analysis: string; suggestions: string[] }>> {
    const response = await this.api.post(`/ai/analyze-failure`, { testRunId, failureId });
    return response.data;
  }

  async analyzeFailureConversational(
    testRunId: string, 
    failureId: string, 
    conversationHistory: any[], 
    question: string
  ): Promise<ApiResponse<{ analysis: string; suggestions: string[] }>> {
    const response = await this.api.post('/ai/analyze-failure-conversational', {
      testRunId,
      failureId,
      conversationHistory,
      question
    });
    return response.data;
  }
  
  // AI-assisted Test Step Execution
  async interpretTestStep(stepDescription: string): Promise<ApiResponse<string>> {
    try {
      if (this.verboseLogging) {
        console.log(chalk.gray(`[DEBUG] Interpreting step: "${stepDescription}"`));
      }
      const response = await this.api.post('/ai/interpret-step', {
        description: stepDescription,
      });
      if (this.verboseLogging) {
        console.log(chalk.gray(`[DEBUG] Interpretation response: ${JSON.stringify(response.data)}`));
      }
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data.interpretedStep // Assuming the API returns { success: true, data: { interpretedStep: '...' } }
        };
      } else {
        return {
          success: false,
          data: '',
          error: response.data.error || 'Failed to interpret step'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        data: '',
        error: error.response?.data?.message || error.message || 'Unknown error'
      };
    }
  }

  async suggestAlternative(step: string, pageContext = ''): Promise<ApiResponse<string>> { // Assuming AI returns a string
    try {
      if (this.verboseLogging) {
        console.log(chalk.gray(`[DEBUG] Suggesting alternative for step: "${step}"`));
        console.log(chalk.gray(`[DEBUG] Page context length: ${pageContext.length}`));
      }
      const response = await this.api.post('/ai/suggest-alternative', {
        step,
        pageContext,
      });
      if (this.verboseLogging) {
        console.log(chalk.gray(`[DEBUG] Suggestion response: ${JSON.stringify(response.data)}`));
      }
      return response.data; // Assuming API returns ApiResponse<string> directly
    } catch (error: any) {
      if (this.verboseLogging) {
        console.log(chalk.red(`[DEBUG] Error suggesting alternative: ${error.message}`));
      }
      return {
        success: false,
        data: '',
        error: error.response?.data?.message || error.message || 'Unknown error',
      };
    }
  }
  
  async getDynamicSelectorSuggestion(context: {
    failedSelector: string;
    descriptiveTerm: string;
    pageUrl: string;
    domSnippet: string;
    originalStep: string;
  }): Promise<ApiResponse<{ suggestedSelector: string; suggestedStrategy?: string; confidence?: number; reasoning?: string }>> {
    try {
      const response = await this.api.post('/ai/suggest-selector', context);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        data: { suggestedSelector: '' },
        error: error.response?.data?.message || error.message || 'Unknown error'
      };
    }
  }
}

export const apiClient = new LabnexApiClient(); 