import api from './axios';

export interface TestRunConfig {
  parallel?: number;
  environment?: string;
  aiOptimization?: boolean;
  suite?: string;
  timeout?: number;
}

export interface TestRunRequest {
  testCases?: string[];
  parallel?: number;
  environment?: string;
  aiOptimization?: boolean;
  suite?: string;
  timeout?: number;
}

export interface TestResult {
  testCaseId: string;
  status: 'pass' | 'fail' | 'pending';
  duration: number;
  message?: string;
  error?: string;
  logs?: string[];
  startedAt: string;
  completedAt?: string;
}

export interface TestRun {
  _id: string;
  project: string;
  testCases: string[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: TestRunConfig;
  results: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    duration: number;
  };
  testResults: TestResult[];
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
}

export interface TestRunResults {
  testRun: {
    _id: string;
    status: string;
    results: {
      total: number;
      passed: number;
      failed: number;
      pending: number;
      duration: number;
    };
    config: TestRunConfig;
    startedAt: string;
    completedAt?: string;
  };
  testCases: Array<{
    _id: string;
    title: string;
    status: string;
    duration: number;
    message?: string;
    error?: string;
    logs?: string[];
    startedAt: string;
    completedAt?: string;
  }>;
}

// Test Runner API Functions
export const testRunnerApi = {
  // Create and start a test run
  createTestRun: async (projectId: string, config: TestRunRequest): Promise<TestRun> => {
    const response = await api.post(`/projects/${projectId}/test-runs`, config);
    return response.data.data;
  },

  // Get test run status
  getTestRun: async (runId: string): Promise<TestRun> => {
    const response = await api.get(`/test-runs/${runId}`);
    return response.data.data;
  },

  // Get detailed test run results
  getTestRunResults: async (runId: string): Promise<TestRunResults> => {
    const response = await api.get(`/test-runs/${runId}/results`);
    return response.data.data;
  },

  // Cancel a running test
  cancelTestRun: async (runId: string): Promise<TestRun> => {
    const response = await api.post(`/test-runs/${runId}/cancel`);
    return response.data.data;
  },
};

// AI API Functions
export interface GenerateTestCaseRequest {
  description: string;
}

export interface GeneratedTestCase {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
}

export interface OptimizeTestSuiteRequest {
  codeChanges?: string[];
}

export interface OptimizedTestSuite {
  selectedTests: string[];
  reasoning: string;
  optimizationTime: number;
  totalTests: number;
  selectedCount: number;
}

export interface AnalyzeFailureRequest {
  testRunId: string;
  failureId: string;
}

export interface FailureAnalysis {
  analysis: string;
  suggestions: string[];
  testCase: {
    title: string;
    description: string;
  };
  failureDetails: {
    status: string;
    duration: number;
    error?: string;
    message?: string;
  };
}

export const aiApi = {
  // Generate test case with AI
  generateTestCase: async (request: GenerateTestCaseRequest): Promise<GeneratedTestCase> => {
    const response = await api.post('/ai/generate-test-case', request);
    return response.data.data;
  },

  // Optimize test suite with AI
  optimizeTestSuite: async (projectId: string, request: OptimizeTestSuiteRequest): Promise<OptimizedTestSuite> => {
    const response = await api.post(`/ai/optimize-test-suite/${projectId}`, request);
    return response.data.data;
  },

  // Analyze test failure with AI
  analyzeFailure: async (request: AnalyzeFailureRequest): Promise<FailureAnalysis> => {
    const response = await api.post('/ai/analyze-failure', request);
    return response.data.data;
  },
};

// WebSocket connection for real-time updates
export const createTestRunWebSocket = (runId: string, token: string): WebSocket => {
  // Determine the correct WebSocket URL based on environment
  const isProduction = import.meta.env.PROD;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  let wsBaseUrl;
  if (isProduction && !isLocalhost) {
    // Production deployment - use secure WebSocket to Render backend
    wsBaseUrl = 'wss://labnex-backend.onrender.com';
  } else {
    // Development mode - use local WebSocket
    wsBaseUrl = 'ws://localhost:5000';
  }
  
  const wsUrl = `${wsBaseUrl}/test-runs/${runId}/stream`;
  const ws = new WebSocket(`${wsUrl}?token=${token}`);
  
  return ws;
}; 