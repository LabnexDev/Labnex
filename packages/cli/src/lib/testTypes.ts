export interface TestResult {
  status: 'passed' | 'failed';
  message?: string;
  screenshot?: string; // Base64 encoded screenshot
  duration: number;
}

export interface TestCaseResult {
  testCaseId: string;
  status: 'passed' | 'failed';
  steps: Array<TestResult & { stepDescription: string; stepNumber: number }>;
  duration: number;
  logs: string[];
}

export interface AssertionDetails {
  type: 
    | 'url'
    | 'elementText'
    | 'elementVisible'
    | 'pageText'
    | 'elementValue';
  selector?: string;
  expectedText?: string;
  condition: 
    | 'equals' 
    | 'contains' 
    | 'isVisible';
}

export interface ParsedTestStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 
          'select' | 'scroll' | 'hover' | 'upload' | 'dragAndDrop' |
          'switchToIframe' | 'switchToMainContent' |
          'assert' | 'executeScript';
  target?: string;
  value?: string;
  timeout?: number;
  filePath?: string; 
  destinationTarget?: string; 
  originalStep: string;
  expectsDialog?: {
    type: 'alert' | 'confirm' | 'prompt';
    action: 'accept' | 'dismiss';
    promptText?: string; 
  };
  assertion?: AssertionDetails;
} 