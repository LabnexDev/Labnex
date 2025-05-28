import puppeteer, { Browser, Page, ElementHandle, JSHandle, Frame } from 'puppeteer';
import { TestStepParser } from './testStepParser'; // CLI version of parser
import { ParsedTestStep } from './lib/testTypes'; // Corrected import
import { findElementWithFallbacks, AddLogFunction } from './lib/elementFinder';
import * as actionHandlers from './lib/actionHandlers';
import { TestResult, TestCaseResult } from './lib/testTypes';
import { apiClient, ApiResponse } from './api/client'; // Assuming apiClient will be enhanced or used for AI

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
    const logMessage = data ? `${message} ${JSON.stringify(data).substring(0, 100)}...` : message;
    console.log(`[LBE] ${logMessage}`);
    this.logs.push(`[${new Date().toISOString().substring(0, 19).replace('T', ' ')}] ${logMessage}`);
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
    // Reset AI context or logs for this test case to avoid carryover
    this.addLog(`[AI] Resetting context for new test case ${testCaseId}.`);
    
    const { stepResults, overallStatus } = await this._executeStepsInSequence(stepDescriptions, baseUrl, overallExpectedResult);
    

    const duration = Date.now() - startTime;
    this.addLog(`Test case ${testCaseId} finished. Status: ${overallStatus}, Duration: ${duration}ms`);
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
      this.addLog(`Step ${i + 1}: ${stepDescription.substring(0, 50)}...`);
      
      const result = await this._processSingleStep(stepDescription, baseUrl, i + 1, overallExpectedResult);
      stepResults.push({ ...result, stepDescription: stepDescription, stepNumber: i + 1 });

      if (result.status === 'failed') {
        overallStatus = 'failed';
        this.addLog(`Step ${i + 1} failed: ${result.message?.substring(0, 100)}...`);
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
    attempt: number = 0 // 0 for original, 1+ for AI suggested retry
  ): Promise<TestResult> {
    const stepStartTime = Date.now();
    let result: TestResult = { status: 'failed', message: 'Not executed yet', duration: 0 };
    let stepDuration = 0;
    const MAX_AI_ATTEMPTS = 3; // Increased to allow more follow-up suggestions
    const MAX_RETRY_ATTEMPTS = 5; // Max retries for rate limit errors
    const BASE_RETRY_DELAY_MS = 2000; // Increased base delay to 2 seconds for retries

    let stepDescriptionToParse = stepDescription;

    if (this.aiOptimizationEnabled && attempt === 0) { // Only interpret on the original attempt
      this.addLog(`[AI] Interpreting step ${stepNumber}: ${stepDescription.substring(0, 30)}...`);
      try {
        const aiResponse = await this.retryApiCall(() => apiClient.interpretTestStep(stepDescription), MAX_RETRY_ATTEMPTS, BASE_RETRY_DELAY_MS, `interpret step ${stepNumber}`);
        if (aiResponse.success && aiResponse.data) {
          // Extract only the first actionable step, ignoring alternatives with 'or'
          const firstStep = aiResponse.data.split(/\s+or\s+/i)[0].trim();
          this.addLog(`[AI] Interpreted step ${stepNumber} as: ${firstStep.substring(0, 50)}...`);
          // Extract selector from within quotes if it's an element action
          const selectorMatch = firstStep.match(/"([^"]+)"/);
          if (selectorMatch && selectorMatch[1]) {
            const extractedSelector = selectorMatch[1];
            this.addLog(`[AI] Extracted selector: ${extractedSelector.substring(0, 50)}...`);
            let stepObject = {} as ParsedTestStep;
            if (firstStep.toLowerCase().includes('click')) {
              stepObject = {
                action: 'click',
                target: extractedSelector,
                originalStep: stepDescription
              };
              this.addLog(`[AI] Parsed as click action with selector: ${extractedSelector.substring(0, 30)}...`);
            } else if (firstStep.toLowerCase().includes('navigate') || firstStep.toLowerCase().includes('url')) {
              stepObject = {
                action: 'navigate',
                target: extractedSelector,
                originalStep: stepDescription
              };
              this.addLog(`[AI] Parsed as navigate action to: ${extractedSelector.substring(0, 30)}...`);
            } else if (firstStep.toLowerCase().includes('wait') || firstStep.toLowerCase().includes('pause')) {
              const timeoutMatch = firstStep.match(/\d+/);
              const timeout = timeoutMatch ? parseInt(timeoutMatch[0], 10) : 3000;
              stepObject = {
                action: 'wait',
                timeout: timeout,
                originalStep: stepDescription
              };
              this.addLog(`[AI] Parsed as wait action for ${timeout}ms.`);
            } else {
              stepDescriptionToParse = firstStep;
            }
          } else {
            stepDescriptionToParse = firstStep;
          }
        } else {
          this.addLog(`[AI] Interpretation failed for step ${stepNumber}. Error: ${aiResponse.error || 'Unknown'}`);
        }
      } catch (error: any) {
        this.addLog(`[AI] Error interpreting step ${stepNumber}: ${error.message.substring(0, 50)}...`);
      }
    }

    // Custom parsing for navigation steps from AI response
    let stepObject = TestStepParser.parseStep(stepDescriptionToParse);
    // Check if the parsed step action is not recognized or needs fallback
    if (!stepObject.action && this.aiOptimizationEnabled) {
      this.addLog(`[AI] Step ${stepNumber} not parsed. Requesting AI interpretation.`);
      try {
        // Capture page context for AI to interpret undefined actions
        let detailedPageContext = 'DOM snapshot unavailable';
        if (this.page) {
          try {
            // Wait for page to stabilize before capturing context. Adjusted timeout and condition.
            await this.page.waitForNavigation({ timeout: 1500, waitUntil: 'networkidle0' }).catch(() => this.addLog(`[AI] No significant navigation or network activity, proceeding with current content for context.`));
            
            detailedPageContext = await this.page.evaluate(() => {
              const MAX_ELEMENTS_CTX = 75; 
              const MAX_ATTR_LENGTH_CTX = 40;
              const MAX_TEXT_LENGTH_CTX = 60;
              const MAX_TOTAL_STRING_LENGTH = 7000; // Target for the final string

              function truncateCtx(str: string, len: number): string {
                if (!str) return '';
                return str.length > len ? str.substring(0, len - 3) + "..." : str;
              }

              let elementCount = 0;
              function elementToStringCtx(el: Element | null): string {
                if (!el || elementCount >= MAX_ELEMENTS_CTX) return '';
                elementCount++;
                
                const tagName = el.tagName.toLowerCase();
                let attrs = '';
                for (let i = 0; i < el.attributes.length; i++) {
                  const attr = el.attributes[i];
                  if (attr.name === 'style' || attr.name.startsWith('on') || attr.name === 'd' || attr.name === 'stroke-width' || attr.name.startsWith('aria-') && attr.value.length > 100) continue;
                  const attrValue = truncateCtx(attr.value, MAX_ATTR_LENGTH_CTX);
                  attrs += ` ${attr.name}="${attrValue}"`;
                }

                let childrenString = '';
                if (el.children.length > 0) {
                  for (let i = 0; i < el.children.length; i++) {
                    if (elementCount >= MAX_ELEMENTS_CTX) break;
                    childrenString += elementToStringCtx(el.children[i] as Element);
                  }
                }
                
                let textContent = '';
                if ((!el.children.length || childrenString.length === 0) && el.childNodes.length > 0) {
                  let directText = '';
                  for (let i = 0; i < el.childNodes.length; i++) {
                    const childNode = el.childNodes[i];
                    if (childNode.nodeType === Node.TEXT_NODE && childNode.textContent?.trim()) {
                      directText += childNode.textContent.trim() + " ";
                    }
                  }
                  if(directText.trim()){
                    textContent = truncateCtx(directText.trim(), MAX_TEXT_LENGTH_CTX);
                  }
                }
                
                if (!childrenString && ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label', 'td', 'th'].includes(tagName)) {
                    const ownText = (el as HTMLElement).innerText?.trim();
                    if (ownText) {
                        textContent = truncateCtx(ownText, MAX_TEXT_LENGTH_CTX * 2);
                    }
                }
                return `<${tagName}${attrs}>${textContent}${childrenString}</${tagName}>`;
              }
              const rootElement = document.querySelector('main') || document.body;
              let fullHtml = elementToStringCtx(rootElement);
              
              if (fullHtml.length > MAX_TOTAL_STRING_LENGTH) {
                let lastClosingTag = fullHtml.lastIndexOf('</', MAX_TOTAL_STRING_LENGTH);
                if (lastClosingTag !== -1) {
                    let endOfTag = fullHtml.indexOf('>', lastClosingTag);
                    if (endOfTag !== -1 && endOfTag <= MAX_TOTAL_STRING_LENGTH + 30) { // Allow some leeway for tag closure
                        fullHtml = fullHtml.substring(0, endOfTag + 1);
                    } else {
                        fullHtml = fullHtml.substring(0, MAX_TOTAL_STRING_LENGTH);
                    }
                } else {
                    fullHtml = fullHtml.substring(0, MAX_TOTAL_STRING_LENGTH);
                }
                fullHtml += '<!-- DOM structure truncated -->';
              }
              return fullHtml;
            });
            
            this.addLog(`[AI] Captured detailed DOM context for step ${stepNumber} suggestion (length: ${detailedPageContext.length}). Preview: ${detailedPageContext.substring(0,100)}...`);
          } catch (contextError: any) {
            this.addLog(`[AI] Failed to capture detailed DOM context for step suggestion: ${(contextError as Error).message.substring(0, 100)}...`);
            // Fallback to simpler context if detailed capture fails
            detailedPageContext = `Simple page context: URL - ${this.page?.url()}`;
          }
        }
        // Add a delay to ensure AI has time to respond and avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Delay based on attempt number
        const aiSuggestion = await this.retryApiCall(() => apiClient.suggestAlternative(stepDescription, detailedPageContext), MAX_RETRY_ATTEMPTS, BASE_RETRY_DELAY_MS, `suggest alternative for step ${stepNumber}`);
        if (aiSuggestion.success && aiSuggestion.data) {
          // Extract only the first actionable step, ignoring alternatives with 'or'
          const firstStep = aiSuggestion.data.split(/\s+or\s+/i)[0].trim();
          this.addLog(`[AI] Suggested alternative for step ${stepNumber}: ${firstStep.substring(0, 50)}...`);
          // Extract selector from within quotes if it's an element action
          const selectorMatch = firstStep.match(/"([^"]+)"/);
          if (selectorMatch && selectorMatch[1]) {
            const extractedSelector = selectorMatch[1];
            this.addLog(`[AI] Extracted selector for retry: ${extractedSelector.substring(0, 50)}...`);
            if (firstStep.toLowerCase().includes('click')) {
              return await this._processSingleStep(`Click on element "${extractedSelector}"`, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
            } else if (firstStep.toLowerCase().includes('navigate') || firstStep.toLowerCase().includes('url')) {
              return await this._processSingleStep(`Navigate to "${extractedSelector}"`, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
            } else if (firstStep.toLowerCase().includes('wait') || firstStep.toLowerCase().includes('pause')) {
              const timeoutMatch = firstStep.match(/\d+/);
              const timeout = timeoutMatch ? parseInt(timeoutMatch[0], 10) : 3000;
              return await this._processSingleStep(`Wait for ${timeout} milliseconds`, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
            }
          }
          this.addLog(`[AI] Retrying step ${stepNumber} with suggestion...`);
          return await this._processSingleStep(firstStep, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
        } else {
          this.addLog(`[AI] Suggestion failed for step ${stepNumber}. Error: ${aiSuggestion.error || 'Unknown'}`);
          this.addLog(`[AI] Detailed response: ${JSON.stringify(aiSuggestion, null, 2).substring(0, 200)}...`);
          stepDuration = Date.now() - stepStartTime;
          return {
            status: 'failed',
            message: result.message || 'Step failed; AI suggestion unavailable. Check logs.',
            duration: stepDuration,
            screenshot: result.screenshot
          };
        }
      } catch (error: any) {
        this.addLog(`[AI] Error in AI interpretation for step ${stepNumber}: ${error.message.substring(0, 50)}...`);
        stepObject = TestStepParser.parseStep(stepDescription);
      }
    }
    // Custom parsing for AI-suggested navigation steps
    if (!stepObject.action && stepDescriptionToParse.toLowerCase().includes('navigate') || stepDescriptionToParse.toLowerCase().includes('load') || stepDescriptionToParse.toLowerCase().includes('url')) {
      const urlMatch = stepDescriptionToParse.match(/['"](https?:\/\/[^'"]+)['"]/);
      if (urlMatch && urlMatch[1]) {
        stepObject = {
          action: 'navigate',
          target: urlMatch[1],
          originalStep: stepDescriptionToParse
        };
        this.addLog(`[Parse] Detected navigation to: ${urlMatch[1].substring(0, 30)}...`);
      }
    }
    // Custom parsing for AI-suggested click actions
    if (!stepObject.action && stepDescriptionToParse.toLowerCase().includes('click') && stepDescriptionToParse.toLowerCase().includes('open modal')) {
      stepObject = {
        action: 'click',
        target: "xpath://button[contains(text(), 'Open Modal')]",
        originalStep: stepDescriptionToParse
      };
      this.addLog(`[Parse] Detected click for 'Open Modal'.`);
    }

    if (stepObject.action === 'navigate' && stepObject.target && !stepObject.target.startsWith('http')) {
      stepObject.target = new URL(stepObject.target, baseUrl).toString();
      this.addLog(`Resolved navigation to: ${stepObject.target.substring(0, 30)}...`);
    }

    // Fix for selector parsing: Ensure the exact selector from the step is used
    if (stepObject.target && typeof stepObject.target === 'string' && stepObject.target.includes('xpath:')) {
      const xpathMatch = stepObject.target.match(/xpath:([^)]+)/);
      if (xpathMatch && xpathMatch[1]) {
        stepObject.target = `xpath:${xpathMatch[1]}`;
        this.addLog(`[Parse] Using exact XPath selector: ${stepObject.target.substring(0, 30)}...`);
      }
    }

    this.addLog(`[Step] Action: ${stepObject.action}, Target: ${stepObject.target?.substring(0, 30) || 'N/A'}...`);
    try {
      result = await this.executeStep(stepObject, overallExpectedResult);
    } catch (error: any) {
      this.addLog(`[Step] Error executing step ${stepNumber}: ${error.message.substring(0, 50)}...`);
      if (error.message.includes('detached Frame') || error.name === 'TargetCloseError') {
        this.addLog(`[Recovery] Browser frame detached. Restarting...`);
        if (this.browser) {
          await this.browser.close().catch(e => this.addLog(`[Recovery] Error closing browser: ${e.message.substring(0, 50)}...`));
          this.browser = null;
          this.page = null;
          this.currentFrame = null;
        }
        await this.initialize();
        this.addLog(`[Recovery] Browser restarted.`);
        throw new Error(`Browser restarted due to detachment. Retry the step.`);
      }
      throw error;
    }
    

    if (result.status === 'failed' && this.aiOptimizationEnabled && attempt < MAX_AI_ATTEMPTS) {
      this.addLog(`[AI] Step ${stepNumber} failed. Attempting suggestion (${attempt + 1}/${MAX_AI_ATTEMPTS}).`);
      try {
        // Capture page context to send to AI for better suggestions
        let detailedPageContext = 'DOM snapshot unavailable';
        if (this.page) {
          try {
            // Wait for page to stabilize before capturing context. Adjusted timeout and condition.
            await this.page.waitForNavigation({ timeout: 1500, waitUntil: 'networkidle0' }).catch(() => this.addLog(`[AI] No significant navigation or network activity, proceeding with current content for context.`));
            
            detailedPageContext = await this.page.evaluate(() => {
              const MAX_ELEMENTS_CTX = 75; 
              const MAX_ATTR_LENGTH_CTX = 40;
              const MAX_TEXT_LENGTH_CTX = 60;
              const MAX_TOTAL_STRING_LENGTH = 7000; // Target for the final string

              function truncateCtx(str: string, len: number): string {
                if (!str) return '';
                return str.length > len ? str.substring(0, len - 3) + "..." : str;
              }

              let elementCount = 0;
              function elementToStringCtx(el: Element | null): string {
                if (!el || elementCount >= MAX_ELEMENTS_CTX) return '';
                elementCount++;
                
                const tagName = el.tagName.toLowerCase();
                let attrs = '';
                for (let i = 0; i < el.attributes.length; i++) {
                  const attr = el.attributes[i];
                  if (attr.name === 'style' || attr.name.startsWith('on') || attr.name === 'd' || attr.name === 'stroke-width' || attr.name.startsWith('aria-') && attr.value.length > 100) continue;
                  const attrValue = truncateCtx(attr.value, MAX_ATTR_LENGTH_CTX);
                  attrs += ` ${attr.name}="${attrValue}"`;
                }

                let childrenString = '';
                if (el.children.length > 0) {
                  for (let i = 0; i < el.children.length; i++) {
                    if (elementCount >= MAX_ELEMENTS_CTX) break;
                    childrenString += elementToStringCtx(el.children[i] as Element);
                  }
                }
                
                let textContent = '';
                if ((!el.children.length || childrenString.length === 0) && el.childNodes.length > 0) {
                  let directText = '';
                  for (let i = 0; i < el.childNodes.length; i++) {
                    const childNode = el.childNodes[i];
                    if (childNode.nodeType === Node.TEXT_NODE && childNode.textContent?.trim()) {
                      directText += childNode.textContent.trim() + " ";
                    }
                  }
                  if(directText.trim()){
                    textContent = truncateCtx(directText.trim(), MAX_TEXT_LENGTH_CTX);
                  }
                }
                
                if (!childrenString && ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label', 'td', 'th'].includes(tagName)) {
                    const ownText = (el as HTMLElement).innerText?.trim();
                    if (ownText) {
                        textContent = truncateCtx(ownText, MAX_TEXT_LENGTH_CTX * 2);
                    }
                }
                return `<${tagName}${attrs}>${textContent}${childrenString}</${tagName}>`;
              }
              const rootElement = document.querySelector('main') || document.body;
              let fullHtml = elementToStringCtx(rootElement);
              
              if (fullHtml.length > MAX_TOTAL_STRING_LENGTH) {
                let lastClosingTag = fullHtml.lastIndexOf('</', MAX_TOTAL_STRING_LENGTH);
                if (lastClosingTag !== -1) {
                    let endOfTag = fullHtml.indexOf('>', lastClosingTag);
                    if (endOfTag !== -1 && endOfTag <= MAX_TOTAL_STRING_LENGTH + 30) { // Allow some leeway for tag closure
                        fullHtml = fullHtml.substring(0, endOfTag + 1);
                    } else {
                        fullHtml = fullHtml.substring(0, MAX_TOTAL_STRING_LENGTH);
                    }
                } else {
                    fullHtml = fullHtml.substring(0, MAX_TOTAL_STRING_LENGTH);
                }
                fullHtml += '<!-- DOM structure truncated -->';
              }
              return fullHtml;
            });
            
            this.addLog(`[AI] Captured detailed DOM context for step ${stepNumber} suggestion (length: ${detailedPageContext.length}). Preview: ${detailedPageContext.substring(0,100)}...`);
          } catch (contextError: any) {
            this.addLog(`[AI] Failed to capture detailed DOM context for step suggestion: ${(contextError as Error).message.substring(0, 100)}...`);
            // Fallback to simpler context if detailed capture fails
            detailedPageContext = `Simple page context: URL - ${this.page?.url()}`;
          }
        }
        // Add a delay to ensure AI has time to respond and avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Delay based on attempt number
        const aiSuggestion = await this.retryApiCall(() => apiClient.suggestAlternative(stepDescription, detailedPageContext), MAX_RETRY_ATTEMPTS, BASE_RETRY_DELAY_MS, `suggest alternative for step ${stepNumber}`);
        if (aiSuggestion.success && aiSuggestion.data) {
          // Extract only the first actionable step, ignoring alternatives with 'or'
          const firstStep = aiSuggestion.data.split(/\s+or\s+/i)[0].trim();
          this.addLog(`[AI] Suggested alternative for step ${stepNumber}: ${firstStep.substring(0, 50)}...`);
          // Extract selector from within quotes if it's an element action
          const selectorMatch = firstStep.match(/"([^"]+)"/);
          if (selectorMatch && selectorMatch[1]) {
            const extractedSelector = selectorMatch[1];
            this.addLog(`[AI] Extracted selector for retry: ${extractedSelector.substring(0, 50)}...`);
            if (firstStep.toLowerCase().includes('click')) {
              return await this._processSingleStep(`Click on element "${extractedSelector}"`, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
            } else if (firstStep.toLowerCase().includes('navigate') || firstStep.toLowerCase().includes('url')) {
              return await this._processSingleStep(`Navigate to "${extractedSelector}"`, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
            } else if (firstStep.toLowerCase().includes('wait') || firstStep.toLowerCase().includes('pause')) {
              const timeoutMatch = firstStep.match(/\d+/);
              const timeout = timeoutMatch ? parseInt(timeoutMatch[0], 10) : 3000;
              return await this._processSingleStep(`Wait for ${timeout} milliseconds`, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
            }
          }
          this.addLog(`[AI] Retrying step ${stepNumber} with suggestion...`);
          return await this._processSingleStep(firstStep, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
        } else {
          this.addLog(`[AI] Suggestion failed for step ${stepNumber}. Error: ${aiSuggestion.error || 'Unknown'}`);
          this.addLog(`[AI] Detailed response: ${JSON.stringify(aiSuggestion, null, 2).substring(0, 200)}...`);
          stepDuration = Date.now() - stepStartTime;
          return {
            status: 'failed',
            message: result.message || 'Step failed; AI suggestion unavailable. Check logs.',
            duration: stepDuration,
            screenshot: result.screenshot
          };
        }
      } catch (error: any) {
        this.addLog(`[AI] Error getting suggestion for step ${stepNumber}: ${error.message.substring(0, 50)}...`);
        stepDuration = Date.now() - stepStartTime;
        return {
          status: 'failed',
          message: result.message || 'Step failed; AI suggestion retrieval error.',
          duration: stepDuration,
          screenshot: result.screenshot
        };
      }
    }
   
    return {
      status: result.status,
      message: result.message,
      duration: stepDuration,
      screenshot: result.screenshot
    };
  }

  private async executeStep(parsedStep: ParsedTestStep, overallTestCaseExpectedResult?: string): Promise<TestResult> {
    if (!this.page || !this.currentFrame) throw new Error('Page or currentFrame not initialized');
    const stepStartTime = Date.now();
    let status: 'passed' | 'failed' = 'failed';
    let message: string | undefined;
    let screenshot: string | undefined;

    this.addLog(`[Action] ${parsedStep.action}: ${parsedStep.target?.substring(0, 30) || 'N/A'}...`);

    try {
      // Handle custom AI-suggested actions
      if (parsedStep.action === 'custom') {
        this.addLog(`[Custom] Executing AI-suggested action.`);
        // Future enhancement: Execute custom JavaScript or other logic here
        // For now, log as unsupported
        throw new Error('Custom action type not supported yet.');
      } else {
        // Disable hardcoded fallbacks when AI is enabled
        const disableFallbacks = this.aiOptimizationEnabled;
        await this._dispatchStepAction(parsedStep, overallTestCaseExpectedResult, disableFallbacks);
        status = 'passed';
        this.addLog(`[Action] ${parsedStep.action} successful.`);
      }
    } catch (error: any) {
      this.addLog(`[Action] ${parsedStep.action} failed: ${error.message.substring(0, 50)}...`);
      status = 'failed';
      message = error.message;
      try {
        if(this.page) screenshot = await this.page.screenshot({ encoding: 'base64' });
      } catch (screenshotError) {
        this.addLog('[Action] Failed to take screenshot.', screenshotError);
      }
    }
    
    return {
      status,
      message,
      screenshot,
      duration: Date.now() - stepStartTime,
    };
  }

  private async _dispatchStepAction(parsedStep: ParsedTestStep, overallTestCaseExpectedResult?: string, disableFallbacks: boolean = false): Promise<void> {
    let newFrameContext: Frame | Page | null;
    const retryApiCallBound = this.retryApiCall.bind(this);
    try {
      switch (parsedStep.action) {
        case 'navigate':
          if (!this.page || !this.currentFrame) {
            this.addLog(`[Recovery] Page/frame not initialized. Reinitializing...`);
            await this.initialize();
          }
          if (!this.page || !this.currentFrame) { // Add this check after potential re-initialization
            throw new Error('Page or currentFrame still not initialized after recovery attempt.');
          }
          newFrameContext = await actionHandlers.handleNavigate(this.page, this.currentFrame, this.addLog, parsedStep.target || '');
          if (newFrameContext) this.currentFrame = newFrameContext;
          break;
        case 'click':
          await actionHandlers.handleClick(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.originalStep || '', retryApiCallBound);
          break;
        case 'type':
          await actionHandlers.handleType(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.value || '', parsedStep.originalStep || '', retryApiCallBound);
          break;
        case 'wait':
          await actionHandlers.handleWait(this.page, this.addLog, parsedStep.timeout);
          break;
        case 'assert':
          if (!this.page) {
            throw new Error('Page not initialized for assertion');
          }
          if (!this.currentFrame) {
            throw new Error('Current frame not initialized for assertion');
          }
          await actionHandlers.handleAssertion(this.page, this.currentFrame, this.addLog, parsedStep, overallTestCaseExpectedResult, retryApiCallBound);
          break;
        case 'select':
          await actionHandlers.handleSelect(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.value || '', parsedStep.originalStep || '', retryApiCallBound);
          break;
        case 'hover':
          await actionHandlers.handleHover(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.originalStep || '', retryApiCallBound);
          break;
        case 'scroll':
          await actionHandlers.handleScroll(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.originalStep || '', retryApiCallBound);
          break;
        case 'upload':
          let uploadSelector = parsedStep.target || ''; // Default to empty string if undefined
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
                this.addLog(`[Upload] Using original selector: ${selectorFromOriginalStep.substring(0, 30)}...`);
                uploadSelector = selectorFromOriginalStep;
              } else if (hasHintInOriginal === hasHintInParsed && selectorFromOriginalStep !== parsedStep.target) {
                // Both have hints or both lack hints, but are different. Log this interesting case but prefer parsed target.
                this.addLog(`[Upload] Original (${selectorFromOriginalStep.substring(0, 30)}...) and parsed (${(parsedStep.target || '').substring(0, 30)}...) differ. Using parsed.`);
              }
            }
          }
          await actionHandlers.handleUpload(this.page, this.currentFrame, this.addLog, uploadSelector, parsedStep.filePath || '', parsedStep.originalStep || '', retryApiCallBound);
          break;
        case 'dragAndDrop':
            if (!parsedStep.target || !parsedStep.destinationTarget) {
                throw new Error('Source or destination target not provided for drag and drop.');
            }
            await actionHandlers.handleDragAndDrop(this.page, this.currentFrame, this.addLog, parsedStep.target, parsedStep.destinationTarget, parsedStep.originalStep || '', retryApiCallBound);
            break;
      }
    } catch (error: any) {
      this.addLog(`[Action] Error in ${parsedStep.action}: ${error.message.substring(0, 50)}...`);
      if (error.message.includes('detached Frame') || error.name === 'TargetCloseError') {
        this.addLog(`[Recovery] Frame detached. Restarting browser...`);
        if (this.browser) {
          await this.browser.close().catch(e => this.addLog(`[Recovery] Error closing: ${e.message.substring(0, 50)}...`));
          this.browser = null;
          this.page = null;
          this.currentFrame = null;
        }
        await this.initialize();
        this.addLog(`[Recovery] Browser restarted during action.`);
        throw new Error(`Browser restarted due to detachment. Retry.`);
      }
      throw error;
    }
  }

  private async retryApiCall<T>(
    apiCall: () => Promise<ApiResponse<T>>,
    maxRetries: number,
    baseDelayMs: number,
    callDescription: string
  ): Promise<ApiResponse<T>> {
    let retryCount = 0;
    while (retryCount < maxRetries) {
      try {
        const response = await apiCall();
        if (!response.success && response.error?.includes('rate limit') || response.error?.includes('429')) {
          retryCount++;
          if (retryCount === maxRetries) {
            this.addLog(`[AI] Rate limit for ${callDescription}. Max retries (${maxRetries}) reached.`);
            return response;
          }
          const delay = baseDelayMs * Math.pow(2, retryCount - 1);
          this.addLog(`[AI] Rate limit for ${callDescription}. Retry (${retryCount}/${maxRetries}) after ${delay}ms.`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          return response;
        }
      } catch (error: any) {
        retryCount++;
        if (retryCount === maxRetries) {
          this.addLog(`[AI] Error in ${callDescription}. Max retries (${maxRetries}) reached: ${error.message.substring(0, 50)}...`);
          throw error;
        }
        const delay = baseDelayMs * Math.pow(2, retryCount - 1);
        this.addLog(`[AI] Error in ${callDescription}. Retry (${retryCount}/${maxRetries}) after ${delay}ms: ${error.message.substring(0, 50)}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error(`[AI] Max retries reached for ${callDescription}.`);
  }
}