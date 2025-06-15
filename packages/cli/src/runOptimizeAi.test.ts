// @ts-nocheck
import { runTests } from './commands/run';
import { jest } from '@jest/globals';

const mockInitialize = jest.fn();
const mockCleanup = jest.fn();

jest.mock('./localBrowserExecutor', () => ({
  LocalBrowserExecutor: jest.fn().mockImplementation(({ aiOptimizationEnabled }) => {
    return {
      initialize: mockInitialize,
      executeTestCase: jest.fn().mockResolvedValue({
        testCaseId: 'tc1',
        status: 'passed',
        duration: 5,
        steps: []
      }),
      cleanup: mockCleanup,
      aiOptimizationEnabled
    };
  })
}));

jest.mock('./api/client', () => ({
  apiClient: {
    getProjects: (jest.fn() as any).mockResolvedValue({ success: true, data: [{ _id: 'proj1', name: 'Demo', projectCode: 'DEMO' }] }),
    getTestCases: (jest.fn() as any).mockResolvedValue({ success: true, data: [{ _id: 'tc1', title: 'T', steps: ['step'], expectedResult: 'ok' }] })
  }
}));

describe('AI optimization flag', () => {
  it('should create executor with AI optimization enabled', async () => {
    await runTests({
      projectId: 'proj1',
      environment: 'staging',
      mode: 'local',
      headless: true,
      timeout: 5000,
      optimizeAi: true
    });

    // LocalBrowserExecutor constructor should be called with flag true
    const { LocalBrowserExecutor } = require('./localBrowserExecutor');
    expect(LocalBrowserExecutor).toHaveBeenCalledWith(expect.objectContaining({ aiOptimizationEnabled: true }));
  });
}); 