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
  action: 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'select' | 'hover' | 'scroll' | 'upload' | 'dragAndDrop' | 'switchToIframe' | 'switchToMainContent' | 'executeScript' | 'custom';
  target?: string;
  value?: string;
  timeout?: number;
  filePath?: string;
  originalStep?: string;
  expectedText?: string;
  assertionType?: 'visible' | 'present' | 'text' | 'enabled' | 'disabled';
  expectsDialog?: {
    message?: string;
    title?: string;
    type?: 'alert' | 'confirm' | 'prompt';
    response?: string | boolean;
  };
  assertion?: {
    selector?: string;
    expectedText?: string;
    condition?: 'equals' | 'contains' | 'isVisible';
    type?: 'url' | 'elementText' | 'elementVisible' | 'pageText' | 'elementValue';
  };
  destinationTarget?: string;
} 