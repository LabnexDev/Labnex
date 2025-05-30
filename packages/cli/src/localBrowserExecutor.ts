import puppeteer, { Browser, Page, ElementHandle, JSHandle, Frame } from 'puppeteer';
import { TestStepParser } from './testStepParser'; // CLI version of parser
import { ParsedTestStep } from './lib/testTypes'; // Corrected import
import { findElementWithFallbacks, AddLogFunction } from './lib/elementFinderV2';
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
    this.logs = []; // Assuming logs should be cleared on initialize
    this.addLog('Initializing browser...');
    try {
      this.browser = await puppeteer.launch({
        headless: this.headlessMode,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', 
          '--window-size=1920,1080', // Example window size, adjust if needed
          '--start-maximized'
        ],
        defaultViewport: null,
        protocolTimeout: 300000, // Increased protocol timeout to 5 minutes
      });
      this.page = await this.browser.newPage();
      await this.page.setDragInterception(true); // Enable drag interception
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
    const MAX_AI_SUGGESTION_ATTEMPTS = 2; // Max attempts to get an AI selector suggestion for a single step failure
    const MAX_RETRY_ATTEMPTS = 3; // Max retries for API calls (e.g. rate limit)
    const BASE_RETRY_DELAY_MS = 1500;

    let stepDescriptionToParse = stepDescription;
    let initialStepObject: ParsedTestStep | null = null;

    // Initial parsing and interpretation (only on the first attempt for this step string)
    if (attempt === 0) {
      this.addLog(`[AI] Parsing/Interpreting original step ${stepNumber}: "${stepDescription.substring(0, 70)}..."`);
      try {
        initialStepObject = TestStepParser.parseStep(stepDescription);
        if (!initialStepObject.action && this.aiOptimizationEnabled) {
          this.addLog(`[AI] Initial parsing failed to identify action for step ${stepNumber}. Attempting AI interpretation.`);
          const stepDescriptionForAI = stepDescription; // Keep original for logging
          this.addLog('[AI] Calling apiClient.interpretTestStep with description:', { description: stepDescriptionForAI });
          const interpretResponse = await this.retryApiCall(
            () => apiClient.interpretTestStep(stepDescriptionForAI),
            MAX_RETRY_ATTEMPTS, BASE_RETRY_DELAY_MS, `interpret step ${stepNumber}`
          );
          this.addLog('[AI] apiClient.interpretTestStep response:', interpretResponse);

          if (interpretResponse.success && interpretResponse.data) {
            const interpretedStepString = interpretResponse.data.split(/\s+or\s+/i)[0].trim();
            this.addLog(`[AI] Interpreted step ${stepNumber} as: "${interpretedStepString.substring(0, 70)}..."`);
            stepDescriptionToParse = interpretedStepString; // Use AI interpreted string for parsing
            initialStepObject = TestStepParser.parseStep(stepDescriptionToParse);
          } else {
            this.addLog(`[AI] Interpretation failed for step ${stepNumber}. Error: ${interpretResponse.error || 'Unknown'}. Proceeding with original.`);
            // initialStepObject will remain as is from the first TestStepParser.parseStep
          }
        }
      } catch (parseError: any) {
        this.addLog(`[Error] Parsing step "${stepDescriptionToParse}" failed: ${parseError.message}`);
        result = { status: 'failed', message: `Failed to parse step: ${parseError.message}`, duration: Date.now() - stepStartTime };
        return result;
      }
    } else {
      // This is an AI retry, stepDescriptionToParse should already be the AI suggested step string
      this.addLog(`[AI] Attempt ${attempt}: Retrying with AI suggested step: "${stepDescriptionToParse.substring(0,70)}..."`);
      initialStepObject = TestStepParser.parseStep(stepDescriptionToParse);
    }

    if (!initialStepObject || !initialStepObject.action) {
      const message = `Step ${stepNumber} could not be parsed or action not identified: "${stepDescriptionToParse}"`;
      this.addLog(`[Error] ${message}`);
      result = { status: 'failed', message, duration: Date.now() - stepStartTime };
      return result;
    }
    
    // Use a new variable for the step object to be executed in this attempt
    const currentStepObject = initialStepObject; 

    try {
      let actionDescription = currentStepObject.action;
      if (currentStepObject.target) actionDescription += ` on "${String(currentStepObject.target).substring(0,50)}"`;
      if (currentStepObject.value) actionDescription += ` with value "${String(currentStepObject.value).substring(0,30)}"`;
      this.addLog(`[Step] Executing (Attempt ${attempt}): ${actionDescription}`);
      
      result = await this.executeStep(currentStepObject, overallExpectedResult, attempt > 0); 
      result.duration = Date.now() - stepStartTime;
      this.addLog(`[Step] Result for "${currentStepObject.action}" (Attempt ${attempt}): ${result.status}, Message: ${result.message?.substring(0,100)}`);

    } catch (error: any) {
      this.addLog(`[Step] Error executing step ${stepNumber} ("${currentStepObject.action}") (Attempt ${attempt}): ${error.message.substring(0,150)}`);
      result = { status: 'failed', message: error.message, duration: Date.now() - stepStartTime };
    }

    // If step failed, and AI optimization is on, and we haven't exceeded AI attempts for this step
    if (result.status === 'failed' && this.aiOptimizationEnabled && attempt < MAX_AI_SUGGESTION_ATTEMPTS) {
      this.addLog(`[AI] Step ${stepNumber} failed (Action: "${currentStepObject.action}", Target: "${currentStepObject.target || 'N/A'}"). Attempting AI suggestion (${attempt + 1}/${MAX_AI_SUGGESTION_ATTEMPTS}).`);
      
      // Check the original step description to see if it was a navigation attempt.
      // This is a workaround for linter issues with currentStepObject.action type narrowing.
      const originalActionWasNavigate = currentStepObject.originalStep?.toLowerCase().startsWith('navigate to ') || 
                                      stepDescription.toLowerCase().startsWith('navigate to ');

      if (originalActionWasNavigate) {
        this.addLog('[AI] Failed action appears to be "navigate" based on original step description. Skipping AI selector suggestion as it is not applicable for URL issues.');
        return result; // Return original failure
      }

      // Ensure page is available for context capture
      if (!this.page) {
        this.addLog('[AI] Page not available for capturing DOM context. Skipping AI suggestion.');
        return result; // Return original failure
      }

      let detailedPageContext = 'DOM snapshot unavailable';
      try {
        this.addLog('[AI] Capturing DOM context for suggestion...');
        const failedSelectorForContext = typeof currentStepObject.target === 'string' ? currentStepObject.target : null;

        detailedPageContext = await this.page.evaluate((passedFailedSelector) => {
          const MAX_ELEMENTS_CTX = 50; 
          const MAX_ATTR_LENGTH_CTX = 30;
          const MAX_TEXT_LENGTH_CTX = 50;
          const MAX_TOTAL_STRING_LENGTH = 5000;

          function truncateCtx(str: string | null | undefined, len: number): string {
            if (!str) return '';
            return str.length > len ? str.substring(0, len - 3) + "..." : str;
          }
          
          let elementCount = 0; // This must be reset or managed if evaluate is called multiple times with this function
          
          function elementToStringCtx(el: Element | null): string {
            if (!el || elementCount >= MAX_ELEMENTS_CTX) return '';
            elementCount++;
            const tagName = el.tagName.toLowerCase();
            let attrs = '';
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              if (attr.name === 'style' || attr.name.startsWith('on') || attr.name === 'd' || attr.name === 'stroke-width' || (attr.name.startsWith('aria-') && attr.value.length > 70)) continue;
              attrs += ` ${attr.name}="${truncateCtx(attr.value, MAX_ATTR_LENGTH_CTX)}"`;
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
              if(directText.trim()){ textContent = truncateCtx(directText.trim(), MAX_TEXT_LENGTH_CTX); }
            }
            if (!childrenString && !textContent && ['p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'button', 'label', 'td', 'th', 'li'].includes(tagName)) {
                const ownText = (el as HTMLElement).innerText?.trim();
                if (ownText) { textContent = truncateCtx(ownText, MAX_TEXT_LENGTH_CTX * 2); }
            }
            return `<${tagName}${attrs}>${textContent}${childrenString}</${tagName}>`;
          }

          let rootElement: Element | null = null;
          
          if (passedFailedSelector && typeof passedFailedSelector === 'string' && passedFailedSelector.toLowerCase().startsWith('(css:')) {
            let cssSelector = passedFailedSelector.substring(5, passedFailedSelector.length - 1).trim();
            if (cssSelector) {
              const parts = cssSelector.split(/\\s+/); // Simple split by whitespace, handles most basic cases
              for (let i = parts.length - 1; i > 0; i--) {
                let candidateSelector = parts.slice(0, i).join(' ');
                // Avoid trying to select just a combinator if it got isolated
                if (candidateSelector.trim() === '>' || candidateSelector.trim() === '+' || candidateSelector.trim() === '~' || candidateSelector.trim() === '') {
                    continue;
                }
                try {
                  const el = document.querySelector(candidateSelector);
                  if (el) {
                    // console.log(`[DOM Capture] Using smart parent context: "${candidateSelector}"`);
                    rootElement = el;
                    break;
                  }
                } catch (e) { /* ignore invalid intermediate selector */ }
              }
            }
          }

          if (!rootElement) {
            rootElement = document.querySelector('main');
          }
          if (!rootElement) {
            rootElement = document.body;
          }
          
          elementCount = 0; // Reset count for this capture
          let fullHtml = elementToStringCtx(rootElement);

          if (fullHtml.length > MAX_TOTAL_STRING_LENGTH) {
            let lastClosingTag = fullHtml.lastIndexOf('</', MAX_TOTAL_STRING_LENGTH);
            if (lastClosingTag !== -1) {
                let endOfTag = fullHtml.indexOf('>', lastClosingTag);
                if (endOfTag !== -1 && endOfTag <= MAX_TOTAL_STRING_LENGTH + 30) { 
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
        }, failedSelectorForContext); // Pass the failed selector string into evaluate

        this.addLog(`[AI] Captured DOM context (length: ${detailedPageContext.length}). Preview: ${detailedPageContext.substring(0,100)}...`);
      } catch (contextError: any) {
        this.addLog(`[AI] Failed to capture DOM context: ${(contextError as Error).message.substring(0,100)}...`);
        // Proceed with 'DOM snapshot unavailable' or basic context
        detailedPageContext = `Page URL: ${this.page?.url() || 'unknown'}`; 
      }

      try {
        // Correctly determine the descriptive term for AI.
        const descriptiveTermForSuggestion = (typeof currentStepObject.target === 'string' ? currentStepObject.target : '') || 
                                           stepDescription; // original stepDescription as ultimate fallback

        this.addLog(`[AI] Requesting selector suggestion for target: "${currentStepObject.target || 'N/A'}", descriptive: "${descriptiveTermForSuggestion.substring(0,70)}"`);
        
        const selectorParam = typeof currentStepObject.target === 'string' ? currentStepObject.target : '';
        if (!selectorParam && currentStepObject.action !== 'navigate' && currentStepObject.action !== 'wait') { // Only warn if a selector was expected
            this.addLog(`[AI] Warning: Failed step target is not a string or is empty ('${selectorParam}'). AI suggestion might be less effective.`);
        }
        
        const selectorSuggestionResponse = await this.retryApiCall(
          () => apiClient.getDynamicSelectorSuggestion({
            failedSelector: selectorParam,
            descriptiveTerm: descriptiveTermForSuggestion,
            pageUrl: this.page?.url() || '',
            domSnippet: detailedPageContext,
            originalStep: stepDescription // The original human-readable step for context
          }),
          MAX_RETRY_ATTEMPTS,
          BASE_RETRY_DELAY_MS,
          `get dynamic selector for step ${stepNumber}, attempt ${attempt + 1}`
        );

        if (selectorSuggestionResponse.success && selectorSuggestionResponse.data && selectorSuggestionResponse.data.suggestedSelector) {
          const aiData = selectorSuggestionResponse.data;
          // Access confidence and reasoning dynamically as they are not strictly typed on the client side
          const aiConfidence = (aiData as any).confidence;
          const aiReasoning = (aiData as any).reasoning;
          const aiSuggestedSelector = aiData.suggestedSelector;
          const aiSuggestedStrategy = aiData.suggestedStrategy;
          this.addLog(`[AI] Received selector suggestion: "${aiSuggestedSelector}" (Strategy: ${aiSuggestedStrategy || 'N/A'}, Confidence: ${aiConfidence || 'N/A'}, Reasoning: ${aiReasoning || 'N/A'})`);
          
          let aiReconstructedStepString: string;
          const originalStepAction = currentStepObject.action; // Action from the parsed current step

          let finalAiSelectorForReconstructionInHintFormat: string;
          const strategyToUse = aiSuggestedStrategy || 'css';
          let selectorValueForHint = aiSuggestedSelector;

          if (selectorValueForHint.startsWith(strategyToUse + ':')) {
            selectorValueForHint = selectorValueForHint.substring((strategyToUse + ':').length);
          }
          if (selectorValueForHint.startsWith('css:') && strategyToUse === 'css') { // handle accidental double prefix css:css:
            selectorValueForHint = selectorValueForHint.substring('css:'.length);
          } else if (selectorValueForHint.startsWith('xpath:') && strategyToUse === 'xpath') {
            selectorValueForHint = selectorValueForHint.substring('xpath:'.length);
          }
          
          // Ensure the selector value is properly escaped to be a single string argument for the hint
          // JSON.stringify will handle quotes and special characters.
          // The parser for "(type: value)" expects value to be a single token or a quoted string.
          // By JSON.stringify-ing, we ensure it's a valid JS string, then we slice off the outer quotes 
          // because the step parser might expect the raw value or a value with its own quotes if needed.
          let escapedSelectorValue = JSON.stringify(selectorValueForHint);
          if (escapedSelectorValue.startsWith('"') && escapedSelectorValue.endsWith('"')) {
            escapedSelectorValue = escapedSelectorValue.substring(1, escapedSelectorValue.length - 1);
          }

          finalAiSelectorForReconstructionInHintFormat = `(${strategyToUse}: ${escapedSelectorValue})`;
          // For XPaths that need to be single-quoted literals within the (type: 'literal') structure for the parser
          // This is tricky because the target parser's behavior for `(type: value)` isn't fully known.
          // If type is xpath, and value contains single quotes, it must be escaped correctly.
          // The JSON.stringify approach above handles internal quotes by escaping them (e.g., \' or \").
          // Let's assume the parser of (type: value) can handle a value that is itself a correctly escaped string.

          if (strategyToUse === 'xpath') {
            // Ensure XPaths are typically single quoted if they are complex, helps some parsers.
            // However, the main parser expects `(type: value)` where value is the token.
            // The JSON.stringify approach is safer for complex values containing spaces/quotes.
            // Let's stick to JSON.stringify's output, sliced of its own outer quotes.
            finalAiSelectorForReconstructionInHintFormat = `(${strategyToUse}: ${escapedSelectorValue})`;
          } else {
            finalAiSelectorForReconstructionInHintFormat = `(${strategyToUse}: ${escapedSelectorValue})`;
          }
          
          // If the original action was an assertion, keep it as an assertion
          if (originalStepAction === 'assert' && currentStepObject.target) {
            const originalAssertionDetails = currentStepObject.target.match(/type="([^"]+)", selector="([^"]+)", expected="([^"]*)", condition="([^"]+)"/);
            if (originalAssertionDetails) {
              const [, assertType, , assertExpected, assertCondition] = originalAssertionDetails;
              // Reconstruct assertion target with AI selector in its own hint format
              const aiSelectorInHint = `(type=${strategyToUse}, selector=${finalAiSelectorForReconstructionInHintFormat})`; // This part is for the assertion string itself.
              aiReconstructedStepString = `assert "(type=${assertType}, selector=${aiSelectorInHint}, expected=${assertExpected}, condition=${assertCondition})"`;
              this.addLog(`[AI] Reconstructed assertion step (complex): ${aiReconstructedStepString}`);
            } else {
              this.addLog(`[AI] Could not parse original assertion details from target: "${currentStepObject.target}". Defaulting to click.`);
              aiReconstructedStepString = `click "${finalAiSelectorForReconstructionInHintFormat}"`;
            }
          } else if (originalStepAction === 'dragAndDrop' && currentStepObject.target && currentStepObject.destinationTarget) {
            const originalDestinationSelector = currentStepObject.destinationTarget; // This should already be in a good format from original step
            aiReconstructedStepString = `drag "${finalAiSelectorForReconstructionInHintFormat}" to "${originalDestinationSelector}"`;
            this.addLog(`[AI] Reconstructed dragAndDrop step: ${aiReconstructedStepString}`);
          } else {
            // For other actions like 'click', 'type', etc.
            // Ensure the target for the step is JUST the hint string.
            aiReconstructedStepString = `${originalStepAction} ${finalAiSelectorForReconstructionInHintFormat}`;
            if (currentStepObject.value && (originalStepAction === 'type' || originalStepAction === 'select')) {
              // For 'type' and 'select', the value needs to be appended correctly.
              // The parser expects "type (selector) with value "the value""
              aiReconstructedStepString += ` with value "${currentStepObject.value}"`;
            }
          }

          this.addLog(`[AI] Attempt ${attempt + 1}: Retrying with AI suggested step: "${aiReconstructedStepString.substring(0, 150)}..."`);
          // IMPORTANT: Pass the aiReconstructedStepString to the recursive call
          return await this._processSingleStep(aiReconstructedStepString, baseUrl, stepNumber, overallExpectedResult, attempt + 1);
        
        } else {
          this.addLog(`[AI] Selector suggestion failed or no selector provided. Error: ${selectorSuggestionResponse.error || 'No selector in response'}. Raw: ${JSON.stringify(selectorSuggestionResponse).substring(0,100)}`);
          // Fall through to return the original failure if AI doesn't provide a good suggestion
        }
      } catch (aiError: any) {
        this.addLog(`[AI] Error during selector suggestion attempt: ${aiError.message.substring(0,150)}`);
        // Fall through to return the original failure
      }
    }
    
    // If AI was not attempted or failed to provide a retryable suggestion, return the current result
    return result;
  }

  private async executeStep(parsedStep: ParsedTestStep, overallTestCaseExpectedResult?: string, disableFallbacksForAiRetry: boolean = false): Promise<TestResult> {
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
    if (!this.page || !this.currentFrame) {
      throw new Error('Page or frame not initialized for dispatching action.');
    }
    // Destructure carefully based on ParsedTestStep definition
    const { action, target, value, timeout, assertionType, assertion } = parsedStep;
    const variableName = (parsedStep as ParsedTestStep).variableName; // Explicitly cast for variableName
    const condition = assertion?.condition; // Correctly get condition from the assertion object

    this.addLog(`Dispatching action: ${action}, Target: ${target ? target.toString().substring(0,50) : 'N/A'}, Value: ${value ? value.substring(0,50) : 'N/A'}`);

    const commonParams = {
      page: this.page,
      frame: this.currentFrame,
      addLog: this.addLog,
      parsedStep,
      overallTestCaseExpectedResult,
      baseUrl: '', // Base URL might be needed by some handlers, pass if available or handle in specific actions
      disableFallbacksForAiRetry: disableFallbacks, // Pass this through
      retryApiCall: this.retryApiCall.bind(this), // Pass retryApiCall
      apiClient: apiClient // Pass apiClient instance
    };

    let newFrameContext: Frame | Page | null;
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
          await actionHandlers.handleClick(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.originalStep || '', commonParams.retryApiCall);
          break;
        case 'type':
          await actionHandlers.handleType(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.value || '', parsedStep.originalStep || '', commonParams.retryApiCall);
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
          await actionHandlers.handleAssertion(this.page, this.currentFrame, this.addLog, parsedStep, overallTestCaseExpectedResult, commonParams.retryApiCall);
          break;
        case 'select':
          await actionHandlers.handleSelect(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.value || '', parsedStep.originalStep || '', commonParams.retryApiCall);
          break;
        case 'hover':
          await actionHandlers.handleHover(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.originalStep || '', commonParams.retryApiCall);
          break;
        case 'scroll':
          await actionHandlers.handleScroll(this.page, this.currentFrame, this.addLog, parsedStep.target || '', parsedStep.originalStep || '', commonParams.retryApiCall);
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
          await actionHandlers.handleUpload(this.page, this.currentFrame, this.addLog, uploadSelector, parsedStep.filePath || '', parsedStep.originalStep || '', commonParams.retryApiCall);
          break;
        case 'dragAndDrop':
          if (!target) throw new Error('Drag and drop requires a source selector');
          if (!parsedStep.destinationTarget) throw new Error('Drag and drop requires a destination selector');
          // Use V2 handler when AI optimization is enabled for better reliability
          if (this.aiOptimizationEnabled) {
            await actionHandlers.handleDragAndDropV2(
              this.page, this.currentFrame, this.addLog, 
              target, parsedStep.destinationTarget, 
              parsedStep.originalStep || '',
              this.retryApiCall.bind(this)
            );
          } else {
            await actionHandlers.handleDragAndDrop(
              this.page, this.currentFrame, this.addLog, 
              target, parsedStep.destinationTarget, 
              parsedStep.originalStep || '',
              this.retryApiCall.bind(this)
            );
          }
          break;
        case 'switchToIframe':
          newFrameContext = await actionHandlers.handleSwitchToIframe(this.page, this.addLog, parsedStep.target);
          if (newFrameContext) {
            this.currentFrame = newFrameContext;
            this.addLog('[LBE_Context] Switched to iframe successfully. Current context is an iframe.');
          } else {
            this.currentFrame = this.page; // Fallback to main page if iframe switch failed or returned null
            this.addLog('[LBE_Context] Failed to switch to iframe or iframe not found. Context reset to main page.');
            // Optionally, we might want to throw an error here if failing to switch to an iframe is critical
            // throw new Error(`Failed to switch to iframe with selector: ${parsedStep.target}`);
          }
          break;
        case 'switchToMainContent':
          newFrameContext = actionHandlers.handleSwitchToMainContent(this.page, this.addLog);
          this.currentFrame = newFrameContext; // This will be the main page
          this.addLog('[LBE_Context] Switched to main content. Current context is the main page.');
          break;
        default:
          throw new Error(`Unsupported action: ${parsedStep.action}`);
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
      } else {
        // Re-throw other errors to be caught by executeStep
        throw error;
      }
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
            throw new Error(`[AI] Max retries reached for ${callDescription}.`);
          }
          await this.retryApiCall(apiCall, maxRetries, baseDelayMs, callDescription);
        }
        return response;
      } catch (error: any) {
        this.addLog(`[AI] Error during retry attempt: ${error.message.substring(0,150)}`);
        await this.retryApiCall(apiCall, maxRetries, baseDelayMs, callDescription);
      }
    }
    throw new Error(`[AI] Max retries reached for ${callDescription}.`);
  }

  public async cleanup(): Promise<void> {
    this.addLog('Cleaning up browser...');
    if (this.browser) {
      try {
        await this.browser.close();
        this.addLog('Browser closed successfully.');
      } catch (error: any) {
        this.addLog('Error closing browser during cleanup:', error);
      } finally {
        this.browser = null;
        this.page = null;
        this.currentFrame = null;
      }
    } else {
      this.addLog('Browser was not initialized or already closed. No cleanup needed.');
    }
    this.logs = []; 
  }
}

function actionNeedsPrimaryTarget(action: string): boolean {
    switch (action) {
        case 'wait':
        case 'custom':
        case 'storeUrl':
        case 'storeTitle':
            return false;
        case 'dragAndDrop':
            return true;
        default:
            return true;
    }
}