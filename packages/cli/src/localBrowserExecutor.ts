import puppeteer, { Browser, Page, ElementHandle, JSHandle, Frame } from 'puppeteer';
import { TestStepParser } from './testStepParser'; // CLI version of parser
import { ParsedTestStep } from './lib/testTypes'; // Corrected import
import { findElementWithFallbacks, AddLogFunction } from './lib/elementFinder';
import * as actionHandlers from './lib/actionHandlers';
import { TestResult, TestCaseResult } from './lib/testTypes';
import { apiClient } from './api/client'; // Assuming apiClient will be enhanced or used for AI

export class LocalBrowserExecutor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private currentFrame: Page | Frame | null = null;
  private logs: string[] = [];
  private headlessMode: boolean = false;
  private aiOptimizationEnabled: boolean = false; // Added AI flag

  constructor(options: { headless?: boolean; aiOptimizationEnabled?: boolean } = {}) { // Added aiOptimizationEnabled
    this.headlessMode = options.headless !== undefined ? options.headless : false;
    this.aiOptimizationEnabled = options.aiOptimizationEnabled || false; // Initialize AI flag
    this.addLog(`AI Optimization Enabled: ${this.aiOptimizationEnabled}`); // Log AI status
  }

  private addLog: AddLogFunction = (message: string, data?: any) => {
    const logMessage = data ? `${message} ${JSON.stringify(data)}` : message;
    console.log(`[LocalBrowserExecutor] ${logMessage}`);
    this.logs.push(`[${new Date().toISOString()}] ${logMessage}`);
  }

  async initialize(): Promise<void> {
    this.logs = [];
    this.addLog('Initializing browser...');
    this.addLog(`Headless mode: ${this.headlessMode}`);
    try {
      this.browser = await puppeteer.launch({
        headless: this.headlessMode,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--start-maximized'
        ],
        defaultViewport: null
      });
      this.page = await this.browser.newPage();
      this.currentFrame = this.page;
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

    if (this.page && !this.currentFrame) {
        this.currentFrame = this.page;
    }
    if (!this.page || !this.currentFrame) throw new Error('Page or currentFrame not initialized');

    const startTime = Date.now();
    this.addLog(`Starting test case: ${testCaseId}`);
    
    const { stepResults, overallStatus } = await this._executeStepsInSequence(stepDescriptions, baseUrl, overallExpectedResult);

    const duration = Date.now() - startTime;
    this.addLog(`Test case ${testCaseId} finished with status: ${overallStatus}. Duration: ${duration}ms`);
    return {
      testCaseId,
      status: overallStatus,
      steps: stepResults,
      duration,
      logs: [...this.logs]
    };
  }

  private async _executeStepsInSequence(stepDescriptions: string[], baseUrl: string, overallExpectedResult?: string): 
    Promise<{ stepResults: Array<TestResult & { stepDescription: string; stepNumber: number }>, overallStatus: 'passed' | 'failed' }> {
    const stepResults: Array<TestResult & { stepDescription: string; stepNumber: number }> = [];
    let overallStatus: 'passed' | 'failed' = 'passed';

    for (let i = 0; i < stepDescriptions.length; i++) {
      const stepDescription = stepDescriptions[i];
      this.addLog(`Executing step ${i + 1}: ${stepDescription}`);
      
      const result = await this._processSingleStep(stepDescription, baseUrl, i + 1, overallExpectedResult, 0);
      stepResults.push({ ...result, stepDescription: stepDescription, stepNumber: i + 1 });

      if (result.status === 'failed') {
        overallStatus = 'failed';
        this.addLog(`Step ${i + 1} (${stepDescription}) failed. Halting test case.`);
        break;
      }
    }
    return { stepResults, overallStatus };
  }

  private async _processSingleStep(
    stepDescription: string, 
    baseUrl: string, 
    stepNumber: number, 
    overallExpectedResult?: string,
    attempt: number = 0 // 0 for original, 1 for AI suggested retry
  ): Promise<TestResult> {
    const stepStartTime = Date.now();
    let result: TestResult;
    const MAX_AI_ATTEMPTS = 1; // Allow one AI-suggested retry

    let stepDescriptionToParse = stepDescription;

    if (this.aiOptimizationEnabled && attempt === 0) { // Only interpret on the original attempt
      this.addLog(`[AI Interaction] Attempting to interpret step ${stepNumber}:`, stepDescription);
      try {
        const aiResponse = await apiClient.interpretTestStep(stepDescription);
        if (aiResponse.success && aiResponse.data) {
          this.addLog(`[AI Interaction] AI Interpreted step ${stepNumber} as:`, aiResponse.data);
          stepDescriptionToParse = aiResponse.data;
        } else {
          this.addLog(`[AI Interaction] AI Interpretation for step ${stepNumber} failed or no data. Using original step. Error:`, aiResponse.error);
        }
      } catch (interpretError: any) {
        this.addLog(`[AI Interaction] Error during API call for interpretTestStep for step ${stepNumber}:`, interpretError.message);
      }
    }

    try {
      const parsedStep = TestStepParser.parseStep(stepDescriptionToParse);
      if (parsedStep.action === 'dragAndDrop') {
        this.addLog(`[Executor Pre-Execute] Parsed dragAndDrop step. Source: "${parsedStep.target ?? 'N/A'}", Destination: "${parsedStep.destinationTarget ?? 'N/A'}"`);
      }
      if (parsedStep.action === 'navigate' && parsedStep.target && !parsedStep.target.startsWith('http')) {
        parsedStep.target = new URL(parsedStep.target, baseUrl).toString();
        this.addLog(`Resolved navigation to: ${parsedStep.target}`);
      }
      result = await this.executeStep(parsedStep, overallExpectedResult);
      if (result.status === 'failed' && this.aiOptimizationEnabled && attempt < MAX_AI_ATTEMPTS) {
        this.addLog(`[AI Interaction] Step ${stepNumber} ("${stepDescription}") failed. Attempting AI suggestion (Attempt ${attempt + 1}/${MAX_AI_ATTEMPTS}). Error: ${result.message}`);
        try {
          const aiSuggestion = await apiClient.suggestAlternative(stepDescription); // Use original step for context
          if (aiSuggestion.success && aiSuggestion.data) {
            this.addLog(`[AI Interaction] AI Suggested alternative for step ${stepNumber}:`, aiSuggestion.data);
            this.addLog(`[AI Interaction] Retrying step ${stepNumber} with AI suggestion...`);
            // Recursive call with the AI's suggestion and incremented attempt count
            return await this._processSingleStep(aiSuggestion.data, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
          } else {
            this.addLog(`[AI Interaction] AI Suggestion for step ${stepNumber} failed or no data. Step remains failed. Error:`, aiSuggestion.error);
          }
        } catch (suggestionError: any) {
          this.addLog(`[AI Interaction] Error during API call for suggestAlternative for step ${stepNumber}:`, suggestionError.message);
        }
      }
    } catch (error: any) { // This catch is for errors during parsing or if executeStep itself throws an unhandled one
      this.addLog(`Error executing step ${stepNumber} ("${stepDescriptionToParse}"): ${error.message}`);
      
      if (this.aiOptimizationEnabled && attempt < MAX_AI_ATTEMPTS) {
        this.addLog(`[AI Interaction] Step ${stepNumber} ("${stepDescription}") failed catastrophically. Attempting AI suggestion (Attempt ${attempt + 1}/${MAX_AI_ATTEMPTS}). Error: ${error.message}`);
        try {
          const aiSuggestion = await apiClient.suggestAlternative(stepDescription); // Use original step for context
          if (aiSuggestion.success && aiSuggestion.data) {
            this.addLog(`[AI Interaction] AI Suggested alternative for step ${stepNumber}:`, aiSuggestion.data);
            this.addLog(`[AI Interaction] Retrying step ${stepNumber} with AI suggestion...`);
            return await this._processSingleStep(aiSuggestion.data, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
          } else {
            this.addLog(`[AI Interaction] AI Suggestion for step ${stepNumber} failed or no data. Step remains failed. Error:`, aiSuggestion.error);
          }
        } catch (suggestionError: any) {
          this.addLog(`[AI Interaction] Error during API call for suggestAlternative for step ${stepNumber}:`, suggestionError.message);
        }
      }
      // If AI is disabled, or AI suggestion failed, or max attempts reached, then create the failed result object.
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
    return result;
  }

  private async executeStep(parsedStep: ParsedTestStep, overallTestCaseExpectedResult?: string): Promise<TestResult> {
    this.addLog(`[ExecuteStep] Received step object: ${JSON.stringify(parsedStep, null, 2)}`);
    if (!this.page || !this.currentFrame) throw new Error('Page or currentFrame not initialized');
    const stepStartTime = Date.now();
    let status: 'passed' | 'failed' = 'failed';
    let message: string | undefined;
    let screenshot: string | undefined;

    this.addLog(`[ExecuteStep] Action: ${parsedStep.action}, Target: ${parsedStep.target || 'N/A'}, Value: ${parsedStep.value || 'N/A'}`);

    this.setupDialogHandler(parsedStep);

    try {
      await this._dispatchStepAction(parsedStep, overallTestCaseExpectedResult);
      status = 'passed';
      this.addLog(`Action ${parsedStep.action} successful.`);
    } catch (error: any) {
      this.addLog(`Action ${parsedStep.action} failed: ${error.message}`);
      status = 'failed';
      message = error.message;
      try {
        if(this.page) screenshot = await this.page.screenshot({ encoding: 'base64' });
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

  private async _dispatchStepAction(parsedStep: ParsedTestStep, overallTestCaseExpectedResult?: string): Promise<void> {
    let newFrameContext: Frame | Page | null;
    switch (parsedStep.action) {
      case 'navigate':
        newFrameContext = await actionHandlers.handleNavigate(this.page, this.currentFrame, this.addLog, parsedStep.target);
        if (newFrameContext) this.currentFrame = newFrameContext;
        break;
      case 'click':
        await actionHandlers.handleClick(this.page, this.currentFrame, this.addLog, parsedStep.target, parsedStep.originalStep);
        break;
      case 'type':
        await actionHandlers.handleType(this.page, this.currentFrame, this.addLog, parsedStep.target, parsedStep.value, parsedStep.originalStep);
        break;
      case 'wait':
        await actionHandlers.handleWait(this.page, this.addLog, parsedStep.timeout);
        break;
      case 'assert':
        await actionHandlers.handleAssertion(this.page, this.currentFrame, this.addLog, parsedStep, overallTestCaseExpectedResult);
        break;
      case 'select':
        await actionHandlers.handleSelect(this.page, this.currentFrame, this.addLog, parsedStep.target, parsedStep.value, parsedStep.originalStep);
        break;
      case 'hover':
        await actionHandlers.handleHover(this.page, this.currentFrame, this.addLog, parsedStep.target, parsedStep.originalStep);
        break;
      case 'scroll':
        await actionHandlers.handleScroll(this.page, this.currentFrame, this.addLog, parsedStep.target, parsedStep.originalStep);
        break;
      case 'upload':
        let uploadSelector = parsedStep.target; // Default to the target from the parser
        if (parsedStep.originalStep && parsedStep.target && typeof parsedStep.target === 'string') {
          // Regex to capture the content within quotes after "to element "
          const uploadPattern = /upload file.*?to element\s+"([^"]+)"/i;
          const match = uploadPattern.exec(parsedStep.originalStep);
          
          if (match && match[1]) {
            const selectorFromOriginalStep = match[1];
            // Check if selector from original step contains a hint (e.g., (css:...))
            const hasHintInOriginal = /^\((?:css|xpath|id|name|text|value|aria|placeholder|title|data):/i.test(selectorFromOriginalStep);
            // Check if the currently parsed target also contains a hint
            const hasHintInParsed = /^\((?:css|xpath|id|name|text|value|aria|placeholder|title|data):/i.test(parsedStep.target);

            if (hasHintInOriginal && !hasHintInParsed) {
              this.addLog(`[Executor Upload] Using selector from original step string "${selectorFromOriginalStep}" because it contains a hint not present in parsed target "${parsedStep.target}".`);
              uploadSelector = selectorFromOriginalStep;
            } else if (hasHintInOriginal === hasHintInParsed && selectorFromOriginalStep !== parsedStep.target) {
              // Both have hints or both lack hints, but are different. Log this interesting case but prefer parsed target.
              this.addLog(`[Executor Upload] Selector from originalStep ("${selectorFromOriginalStep}") and parsedStep.target ("${parsedStep.target}") differ but have consistent hinting. Using parsedStep.target.`);
            }
          }
        }
        await actionHandlers.handleUpload(this.page, this.currentFrame, this.addLog, uploadSelector, parsedStep.filePath, parsedStep.originalStep);
        break;
      case 'dragAndDrop':
        if (!parsedStep.target) {
          throw new Error('Drag and drop action is missing the source target element.');
        }
        const destTargetForCall = parsedStep.destinationTarget;
        this.addLog(`[Executor Pre-Call HFn] Source for handleDragAndDrop: ##${parsedStep.target}##`);
        this.addLog(`[Executor Pre-Call HFn] Destination for handleDragAndDrop: ##${destTargetForCall ?? 'undefined'}##`);
        await actionHandlers.handleDragAndDrop(this.page, this.currentFrame, this.addLog, parsedStep.target, destTargetForCall, parsedStep.originalStep);
        break;
      case 'switchToIframe':
        newFrameContext = await actionHandlers.handleSwitchToIframe(this.page, this.addLog, parsedStep.target);
        if (newFrameContext) this.currentFrame = newFrameContext;
        else this.addLog("Warning: switchToIframe did not return a valid frame context.");
        break;
      case 'switchToMainContent':
        newFrameContext = actionHandlers.handleSwitchToMainContent(this.page, this.addLog);
        if (newFrameContext) this.currentFrame = newFrameContext;
        break;
      case 'executeScript':
        if (!this.page) {
          throw new Error('Page not initialized for executeScript action.');
        }
        if (!parsedStep.target) {
          throw new Error('executeScript action requires a target property (the frame selector string).');
        }
        if (typeof parsedStep.value !== 'string') {
          throw new Error('executeScript action requires a value property (the script string).');
        }

        const frameSelector = parsedStep.target;
        const scriptToExecute = parsedStep.value;
        this.addLog(`Attempting to execute script in frame. Frame selector: "${frameSelector}"`);

        if (!this.page) { 
          throw new Error('Page is not available for executeScript frame lookup.');
        }
        const page = this.page as Page;

        let frameElementHandle: ElementHandle<HTMLIFrameElement> | null = null;

        let actualSelector = frameSelector; // e.g., "(css: iframe#id)" or "(xpath: //iframe)"
        let isXpath = false;

        const cssMatch = frameSelector.match(/^\(css:\s*(.+)\)$/i);
        const xpathMatch = frameSelector.match(/^\(xpath:\s*(.+)\)$/i);

        if (cssMatch && cssMatch[1]) {
          actualSelector = cssMatch[1].trim();
          isXpath = false;
          this.addLog(`[executeScript] Extracted CSS selector for frame: "${actualSelector}"`);
        } else if (xpathMatch && xpathMatch[1]) {
          actualSelector = xpathMatch[1].trim();
          isXpath = true;
          this.addLog(`[executeScript] Extracted XPath selector for frame: "${actualSelector}"`);
        } else {
          // If no (css: ...) or (xpath: ...) wrapper, assume it's a direct CSS selector by default
          // or potentially an unhandled format. For now, treat as CSS.
          this.addLog(`[executeScript] Frame selector "${frameSelector}" is not in (css:...) or (xpath:...) format. Assuming direct CSS selector.`);
          isXpath = false; // Default to CSS if no explicit type found in this format
        }

        if (isXpath) {
          const jsHandle = await page.evaluateHandle(
            (selector) => {
              const result = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
              return result.singleNodeValue;
            },
            actualSelector // Use the cleaned selector
          );
          if (jsHandle) {
            const element = jsHandle.asElement();
            if (element) {
              frameElementHandle = element as ElementHandle<HTMLIFrameElement>;
            } else {
              await jsHandle.dispose();
            }
          }
        } else {
          frameElementHandle = await page.$(actualSelector) as ElementHandle<HTMLIFrameElement> | null; // Use the cleaned selector
        }

        if (!frameElementHandle) {
          throw new Error(`executeScript: Could not find iframe element with selector "${frameSelector}" (processed to: "${actualSelector}", type: ${isXpath ? 'xpath' : 'css'})`);
        }
        
        const contentFrame = await frameElementHandle.contentFrame();
        if (!contentFrame) {
          throw new Error(`executeScript: Could not get content frame from iframe element "${frameSelector}"`);
        }
        
        this.addLog(`Executing script in found frame: "${scriptToExecute}"`);
        try {
          const scriptResult = await contentFrame.evaluate(scriptToExecute);
          if (typeof scriptResult === 'string') {
            this.addLog(`Script executed via executeScript. Result: "${scriptResult}"`);
          } else if (scriptResult !== undefined && scriptResult !== null) {
            this.addLog('Script executed successfully via executeScript action.', { scriptResult: JSON.stringify(scriptResult) });
          } else {
            this.addLog('Script executed successfully via executeScript action (no specific result returned or result was undefined/null).');
          }
        } catch (e: any) {
          this.addLog(`Error during script execution in frame via executeScript action: ${e.message}`);
          throw e; 
        }
        break;
      default:
        throw new Error(`Unsupported action: ${(parsedStep as any).action}`);
    }
  }

  private setupDialogHandler(parsedStep: ParsedTestStep): void {
    if (parsedStep.expectsDialog && this.page) {
      const dialogExpectation = parsedStep.expectsDialog;
      this.page.once('dialog', async dialog => {
        this.addLog(`Dialog of type "${dialog.type()}" appeared with message: "${dialog.message()}". Expected: ${dialogExpectation.type}, Action: ${dialogExpectation.action}`);
        if (dialogExpectation.type && dialog.type() !== dialogExpectation.type) {
          this.addLog(`Warning: Dialog type mismatch. Expected ${dialogExpectation.type}, but got ${dialog.type()}. Proceeding with action ${dialogExpectation.action}.`);
        }
        try {
          if (dialogExpectation.action === 'accept') {
            if (dialog.type() === 'prompt' && dialogExpectation.promptText !== undefined) {
              await dialog.accept(dialogExpectation.promptText);
              this.addLog(`Dialog prompt accepted with text: "${dialogExpectation.promptText}"`);
            } else {
              await dialog.accept();
              this.addLog('Dialog accepted.');
            }
          } else if (dialogExpectation.action === 'dismiss') {
            await dialog.dismiss();
            this.addLog('Dialog dismissed.');
          } else {
            this.addLog(`Unknown dialog action "${dialogExpectation.action}" specified. Dismissing by default.`);
            await dialog.dismiss();
          }
        } catch (e: any) {
          this.addLog(`Error handling dialog: ${e.message}`);
        }
      });
      this.addLog(`Dialog handler armed for type: ${parsedStep.expectsDialog.type}, action: ${parsedStep.expectsDialog.action}`);
    }
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
      this.currentFrame = null;
    }
  }
} 