import puppeteer, { Browser, Page } from 'puppeteer';
import { TestStepParser, ParsedTestStep } from './testStepParser'; // CLI version of parser

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

export class LocalBrowserExecutor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logs: string[] = [];
  private headlessMode: boolean = false; // Default to visible browser for CLI

  constructor(options: { headless?: boolean } = {}) {
    this.headlessMode = options.headless !== undefined ? options.headless : false;
  }

  private addLog(message: string, data?: any) {
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    console.log(`[LocalBrowserExecutor] ${logMessage}`);
    this.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
  }

  async initialize(): Promise<void> {
    this.logs = [];
    this.addLog('Initializing browser...');
    try {
      this.browser = await puppeteer.launch({
        headless: this.headlessMode,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Often needed in CI/Docker, good to have
          '--start-maximized' // Start with a maximized viewport
        ],
        defaultViewport: null // Allows the --start-maximized to take full effect
      });
      this.page = await this.browser.newPage();
      // Setting a common user agent can help with consistency
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36');
      this.addLog('Browser initialized successfully.');
    } catch (error) {
      this.addLog('Error initializing browser:', error);
      throw error;
    }
  }

  async executeTestCase(
    testCaseId: string,
    stepDescriptions: string[],
    overallExpectedResult?: string,
    baseUrl: string = ''
  ): Promise<TestCaseResult> {
    if (!this.browser || !this.page) {
      await this.initialize();
    }
    if (!this.page) throw new Error('Page not initialized');

    const startTime = Date.now();
    this.addLog(`Starting test case: ${testCaseId}`);
    const stepResults: Array<TestResult & { stepDescription: string; stepNumber: number }> = [];
    let overallStatus: 'passed' | 'failed' = 'passed';

    for (let i = 0; i < stepDescriptions.length; i++) {
      const stepDescription = stepDescriptions[i];
      this.addLog(`Executing step ${i + 1}: ${stepDescription}`);
      const stepStartTime = Date.now();
      let result: TestResult;
      try {
        const parsedStep = TestStepParser.parseStep(stepDescription);
        if (parsedStep.action === 'navigate' && parsedStep.target && !parsedStep.target.startsWith('http')) {
          parsedStep.target = new URL(parsedStep.target, baseUrl).toString();
          this.addLog(`Resolved navigation to: ${parsedStep.target}`);
        }
        result = await this.executeStep(parsedStep, overallExpectedResult);
      } catch (error: any) {
        this.addLog(`Error executing step ${i + 1}: ${error.message}`);
        result = {
          status: 'failed',
          message: error.message,
          duration: Date.now() - stepStartTime,
        };
        try {
            if (this.page) result.screenshot = await this.page.screenshot({ encoding: 'base64' });
        } catch (screenshotError) {
            this.addLog('Failed to take screenshot after error', screenshotError);
        }
      }

      stepResults.push({ ...result, stepDescription: stepDescription, stepNumber: i + 1 });
      if (result.status === 'failed') {
        overallStatus = 'failed';
        this.addLog(`Step ${i + 1} failed. Halting test case.`);
        break; // Stop on first failure
      }
    }

    const duration = Date.now() - startTime;
    this.addLog(`Test case ${testCaseId} finished with status: ${overallStatus}. Duration: ${duration}ms`);
    return {
      testCaseId,
      status: overallStatus,
      steps: stepResults,
      duration,
      logs: [...this.logs] // Return a copy of logs for this test case
    };
  }

  private async executeStep(parsedStep: ParsedTestStep, overallTestCaseExpectedResult?: string): Promise<TestResult> {
    if (!this.page) throw new Error('Page not available');
    const stepStartTime = Date.now();
    let status: 'passed' | 'failed' = 'failed';
    let message: string | undefined;
    let screenshot: string | undefined;

    try {
      switch (parsedStep.action) {
        case 'navigate':
          await this.handleNavigate(parsedStep.target);
          break;
        case 'click':
          await this.handleClick(parsedStep.target);
          break;
        case 'type':
          await this.handleType(parsedStep.target, parsedStep.value);
          break;
        case 'wait':
          await this.handleWait(parsedStep.timeout);
          break;
        case 'assert':
          await this.handleAssert(parsedStep.target, overallTestCaseExpectedResult);
          break;
        // TODO: Implement other actions like 'select', 'scroll', 'hover' if TestStepParser supports them
        default:
          throw new Error(`Unsupported action: ${parsedStep.action}`);
      }
      status = 'passed';
      this.addLog(`Action ${parsedStep.action} successful.`);
    } catch (error: any) {
      this.addLog(`Action ${parsedStep.action} failed: ${error.message}`);
      status = 'failed';
      message = error.message;
      try {
        screenshot = await this.page.screenshot({ encoding: 'base64' });
      } catch (screenshotError) {
        this.addLog('Failed to take screenshot on action failure', screenshotError);
      }
    }
    return {
      status,
      message,
      screenshot,
      duration: Date.now() - stepStartTime,
    };
  }

  private async handleNavigate(url?: string) {
    if (!this.page) throw new Error('Page not available');
    if (!url) throw new Error('Navigation URL not provided');
    this.addLog(`Navigating to ${url}`);
    await this.page.goto(url, { waitUntil: 'networkidle0' });
  }

  private async handleClick(selector?: string) {
    if (!this.page) throw new Error('Page not available');
    if (!selector) throw new Error('Click selector not provided');
    this.addLog(`Clicking on ${selector}`);
    await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
    await this.page.click(selector);
  }

  private async handleType(selector?: string, text?: string) {
    if (!this.page) throw new Error('Page not available');
    if (!selector) throw new Error('Type selector not provided');
    if (text === undefined) throw new Error('Text to type not provided');
    this.addLog(`Typing "${text}" into ${selector}`);

    // Heuristic: If it looks like a common search input selector list, give a slight pause for page to settle (e.g., Google)
    if (selector.includes('input[name*="q"]') || selector.includes('textarea[name*="q"]') || selector.includes('input[type="search"]_') || selector.includes('placeholder*="search"i')) {
        this.addLog('Common search input detected, adding small delay for page stability...');
        await new Promise(resolve => setTimeout(resolve, 750)); // 750ms delay
    }

    await this.page.waitForSelector(selector, { visible: true, timeout: 10000 });
    await this.page.type(selector, text);
  }

  private async handleWait(timeout?: number) {
    if (!this.page) throw new Error('Page not available');
    const waitTime = timeout || 3000; // Default wait
    this.addLog(`Waiting for ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async handleAssert(parsedStepTarget?: string, overallTestCaseExpectedResult?: string) {
    if (!this.page) throw new Error('Page not available');
    if (!parsedStepTarget) throw new Error('Assertion target (from parsed step) not provided');

    this.addLog(`Asserting based on parsed step target: "${parsedStepTarget}"`);
    if(overallTestCaseExpectedResult) {
      this.addLog(`Overall test case expected result provided: "${overallTestCaseExpectedResult}"`);
    }

    // Attempt 1: Treat parsedStepTarget as a selector and check its visibility/content
    try {
      await this.page.waitForSelector(parsedStepTarget, { visible: true, timeout: 10000 });
      this.addLog(`Element with selector "${parsedStepTarget}" is visible.`);
      // If overallTestCaseExpectedResult is provided, check if the element contains this text.
      // This is useful if parsedStepTarget is a selector, and overallTestCaseExpectedResult is the specific text to find within it.
      if (overallTestCaseExpectedResult) {
        this.addLog(`Checking if element "${parsedStepTarget}" contains text "${overallTestCaseExpectedResult}"`);
        const elementText = await this.page.$eval(parsedStepTarget, el => el.textContent);
        if (!elementText || !elementText.includes(overallTestCaseExpectedResult)) {
          throw new Error(`Element "${parsedStepTarget}" found, but did not contain text "${overallTestCaseExpectedResult}". Actual: "${elementText}"`);
        }
        this.addLog(`Element "${parsedStepTarget}" contains text "${overallTestCaseExpectedResult}". Assertion passed.`);
        return; 
      }
      this.addLog(`Selector "${parsedStepTarget}" visible. Assertion passed.`);
      return; // Assertion passed (selector visible, no specific text to check from overallExpectedResult)
    } catch (e) {
      this.addLog(`Attempt 1 failed: Selector "${parsedStepTarget}" not found or text mismatch. Error: ${(e as Error).message}`);
    }

    // Attempt 2: Check if the literal string parsedStepTarget exists on the page content
    this.addLog(`Attempt 2: Checking for literal string "${parsedStepTarget}" on page.`);
    const pageContent = await this.page.content();
    if (pageContent.includes(parsedStepTarget)) {
      this.addLog(`Literal string "${parsedStepTarget}" found on page. Assertion passed.`);
      // If overallTestCaseExpectedResult is also present, ensure it's also on the page for stricter check (optional)
      if (overallTestCaseExpectedResult && !pageContent.includes(overallTestCaseExpectedResult)) {
          throw new Error(`Literal string "${parsedStepTarget}" found, but additionally required overall text "${overallTestCaseExpectedResult}" is NOT present on page.`);
      }
      if(overallTestCaseExpectedResult && pageContent.includes(overallTestCaseExpectedResult)) {
          this.addLog(`Additionally required overall text "${overallTestCaseExpectedResult}" also found on page.`);
      }
      return; // Assertion passed
    }
    this.addLog(`Literal string "${parsedStepTarget}" NOT found on page.`);

    // Attempt 3: If overallTestCaseExpectedResult is different and also not found, this is a definite failure.
    // This attempt is mostly for logging if both parsedStepTarget and overallTestCaseExpectedResult (if different) fail.
    if (overallTestCaseExpectedResult && !pageContent.includes(overallTestCaseExpectedResult)) {
      throw new Error(`Assertion failed: Neither selector/literal "${parsedStepTarget}" nor overall expected text "${overallTestCaseExpectedResult}" were found on page.`);
    }
    // If we reach here, parsedStepTarget failed as selector and literal, and overallTestCaseExpectedResult was either not provided or was the same.
    throw new Error(`Assertion failed: Could not find "${parsedStepTarget}" as a selector or literal text on the page.`);
  }

  async cleanup(): Promise<void> {
    this.addLog('Cleaning up browser...');
    if (this.browser) {
      try {
        await this.browser.close();
        this.addLog('Browser closed successfully.');
      } catch (error) {
        this.addLog('Error closing browser:', error);
      }
      this.browser = null;
      this.page = null;
    }
  }
} 