import { runTests } from './commands/run';
import { jest } from '@jest/globals';

// @ts-nocheck

// Mock Labnex API client
jest.mock('./api/client', () => ({
  apiClient: {
    getProjects: (jest.fn() as any).mockResolvedValue({
      success: true,
      data: [{ _id: 'proj1', name: 'Demo Project', projectCode: 'DEMO' }]
    } as any),
    getTestCases: (jest.fn() as any).mockResolvedValue({
      success: true,
      data: [{ _id: 'tc1', title: 'Sample Test', steps: ['step 1'], expectedResult: 'ok' }]
    } as any)
  }
} as any));

// Mock LocalBrowserExecutor to bypass real browser work
jest.mock('./localBrowserExecutor', () => ({
  LocalBrowserExecutor: jest.fn().mockImplementation(() => ({
    initialize: jest.fn(),
    executeTestCase: (jest.fn() as any).mockResolvedValue({
      testCaseId: 'tc1',
      status: 'passed',
      duration: 50,
      steps: []
    } as any),
    cleanup: jest.fn()
  }))
} as any));

describe('runTests integration', () => {
  it('should execute tests and report success', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await runTests({
      projectId: 'proj1',
      environment: 'staging',
      mode: 'local',
      headless: true,
      timeout: 10000,
      optimizeAi: false
    });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Local Test Run Results'));
    consoleSpy.mockRestore();
  });
}); 