import puppeteer, { Browser, Page, Frame } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
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
  private headlessMode = false;
  private aiOptimizationEnabled = false; // Added AI flag
  private baseUrlGlobal: string = ''; // New persistent baseUrl across steps
  private logFilePath: string;

  constructor(options: { headless?: boolean; aiOptimizationEnabled?: boolean } = {}) {
    this.headlessMode = options.headless !== undefined ? options.headless : false;
    this.aiOptimizationEnabled = options.aiOptimizationEnabled || false;
    this.addLog(`AI Optimization Enabled: ${this.aiOptimizationEnabled}`);
    this.logFilePath = path.join(process.cwd(), 'test_logs.txt');
  }

  private addLog: AddLogFunction = (message: string, data?: any) => {
    const logMessage = data ? `${message} ${JSON.stringify(data).substring(0, 100)}...` : message;
    if (process.env.NODE_ENV === 'development' || process.env.LABNEX_VERBOSE === 'true') {
      console.log(`[LBE] ${logMessage}`);
    }

    this.logs.push(
      `[${new Date().toISOString().substring(0, 19).replace('T', ' ')}] ${logMessage}`
    );
    try {
      const logEntry = `${new Date().toISOString()} - ${logMessage}\n`;
      fs.appendFileSync(this.logFilePath, logEntry);
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`[LBE] Failed to write to log file: ${error.message}`);
      }
    }
  };

  public async initialize(): Promise<void> {
    this.logs = []; // Clear logs on initialization
    this.addLog('Initializing browser...');
    try {
      this.browser = await puppeteer.launch({
        headless: this.headlessMode,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1920,1080',
          '--start-maximized',
        ],
        defaultViewport: null,
        protocolTimeout: 300000, // 5 minutes
      });
      this.page = await this.browser.newPage();
      await this.page.setDragInterception(true);
      this.currentFrame = this.page;
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
      );
      this.addLog('Browser initialized successfully.');
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.addLog('Error initializing browser:', { message: error.message });
        throw error;
      }
      throw new Error('Unknown error initializing browser');
    }
  }

  public async executeTestCase(
    testCaseId: string,
    stepDescriptions: string[],
    overallExpectedResult?: string,
    baseUrl = '',
    testCaseTitle?: string
  ): Promise<TestCaseResult> {
    if (!this.browser || !this.page) {
      await this.initialize();
    }
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    if (this.page && !this.currentFrame) {
      this.currentFrame = this.page;
    }
    if (!this.page || !this.currentFrame) {
      throw new Error('Page or currentFrame not initialized');
    }

    const startTime = Date.now();
    this.addLog(`Starting test case: ${testCaseId}`);
    this.addLog(`[AI] Resetting context for new test case ${testCaseId}.`);

    // Persist provided baseUrl for later heuristic use
    if (baseUrl) {
      this.baseUrlGlobal = baseUrl;
    }

    // Check if test case likely targets saucedemo.com and does not include login steps
    let modifiedStepDescriptions = [...stepDescriptions];
    const isEcommerceTest = (stepDescriptions.some(step => step.toLowerCase().includes('e-commerce')) || (testCaseTitle && testCaseTitle.toLowerCase().includes('e-commerce')));
    const hasLoginStep = stepDescriptions.some(step => step.toLowerCase().includes('login') || step.toLowerCase().includes('enter') || step.toLowerCase().includes('username') || step.toLowerCase().includes('password'));
    if (isEcommerceTest && !hasLoginStep) {
      this.addLog(`[Auto-Login] Detected e-commerce test without login steps. Prepending login steps for saucedemo.com.`);
      modifiedStepDescriptions = [
        'Enter "standard_user" in the username field',
        'Enter "secret_sauce" in the password field',
        'Click the Login button',
        'Wait for the page to redirect to the inventory'
      ].concat(stepDescriptions.slice(1)); // Replace first step if it's just navigation
    }

    const { stepResults, overallStatus } = await this._executeStepsInSequence(
      modifiedStepDescriptions,
      baseUrl,
      overallExpectedResult
    );

    const duration = Date.now() - startTime;
    this.addLog(
      `Test case ${testCaseId} finished. Status: ${overallStatus}, Duration: ${duration}ms`
    );
    return {
      testCaseId,
      status: overallStatus,
      steps: stepResults,
      duration,
      logs: [...this.logs],
    };
  }

  private async _executeStepsInSequence(
    stepDescriptions: string[],
    baseUrl: string,
    overallExpectedResult?: string
  ): Promise<{
    stepResults: Array<TestResult & { stepDescription: string; stepNumber: number }>;
    overallStatus: 'passed' | 'failed';
  }> {
    const stepResults: Array<TestResult & { stepDescription: string; stepNumber: number }> = [];
    let overallStatus: 'passed' | 'failed' = 'passed';

    for (let i = 0; i < stepDescriptions.length; i++) {
      const stepDescription = stepDescriptions[i];
      this.addLog(`Step ${i + 1}: ${stepDescription.substring(0, 50)}...`);

      const result = await this._processSingleStep(
        stepDescription,
        baseUrl,
        i + 1,
        overallExpectedResult
      );
      stepResults.push({
        ...result,
        stepDescription: stepDescription,
        stepNumber: i + 1,
      });

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
    attempt = 0 // 0 for original, 1+ for AI suggested retry
  ): Promise<TestResult> {
    const stepStartTime = Date.now();
    let result: TestResult = { status: 'failed', message: 'Not executed yet', duration: 0 };
    const MAX_AI_SUGGESTION_ATTEMPTS = 2; // Max AI retries
    const MAX_RETRY_ATTEMPTS = 3; // Max API call retries
    const BASE_RETRY_DELAY_MS = 1500;

    let stepDescriptionToParse = stepDescription;
    let initialStepObject: ParsedTestStep | null = null;

    if (attempt === 0) {
      this.addLog(
        `[AI] Parsing/Interpreting original step ${stepNumber}: "${stepDescription.substring(
          0,
          70
        )}..."`
      );
      try {
        initialStepObject = TestStepParser.parseStep(stepDescription);
        if (!initialStepObject.action && this.aiOptimizationEnabled) {
          this.addLog(
            `[AI] Initial parsing failed to identify action for step ${stepNumber}. Attempting AI interpretation.`
          );
          this.addLog('[AI] Calling apiClient.interpretTestStep with description:', {
            description: stepDescription,
          });
          const interpretResponse = await this.retryApiCall(
            () => apiClient.interpretTestStep(stepDescription),
            MAX_RETRY_ATTEMPTS,
            BASE_RETRY_DELAY_MS,
            `interpret step ${stepNumber}`
          );
          this.addLog('[AI] apiClient.interpretTestStep response:', interpretResponse);

          if (interpretResponse.success && interpretResponse.data) {
            // Use first alternative if multiple separated by " or "
            const interpretedStepString = interpretResponse.data.split(/\s+or\s+/i)[0].trim();
            this.addLog(
              `[AI] Interpreted step ${stepNumber} as: "${interpretedStepString.substring(
                0,
                70
              )}..."`
            );
            stepDescriptionToParse = interpretedStepString;
            initialStepObject = TestStepParser.parseStep(stepDescriptionToParse);
          } else {
            this.addLog(
              `[AI] Interpretation failed for step ${stepNumber}. Error: ${
                interpretResponse.error || 'Unknown'
              }. Proceeding with original.`
            );
          }
        }
      } catch (parseError: unknown) {
        if (parseError instanceof Error) {
          this.addLog(
            `[Error] Parsing step "${stepDescriptionToParse}" failed: ${parseError.message}`
          );
          result = {
            status: 'failed',
            message: `Failed to parse step: ${parseError.message}`,
            duration: Date.now() - stepStartTime,
          };
          return result;
        }
        result = {
          status: 'failed',
          message: 'Unknown parsing error',
          duration: Date.now() - stepStartTime,
        };
        return result;
      }
    } else {
      // AI retry
      this.addLog(
        `[AI] Attempt ${attempt}: Retrying with AI suggested step: "${stepDescriptionToParse.substring(
          0,
          70
        )}..."`
      );
      initialStepObject = TestStepParser.parseStep(stepDescriptionToParse);
      // Log the parsed result to verify target extraction
      this.addLog(`[AI Retry Parse Result] Action: ${initialStepObject.action || 'N/A'}, Target: ${initialStepObject.target || 'N/A'}, Value: ${initialStepObject.value || 'N/A'}`);
      // Fallback: If action is 'type' and target is missing, try to extract manually from common AI format
      if (initialStepObject.action === 'type' && !initialStepObject.target) {
        const typePattern = /type\s+\(([^)]+)\)\s+with\s+value\s+(['"])(.*?)\2/i;
        const typeMatch = stepDescriptionToParse.match(typePattern);
        if (typeMatch && typeMatch[1] && typeMatch[3]) {
          this.addLog(`[AI Retry Fallback] Manually extracted selector: ${typeMatch[1]}, value: ${typeMatch[3]}`);
          initialStepObject.target = typeMatch[1].trim();
          initialStepObject.value = typeMatch[3];
        } else {
          this.addLog(`[AI Retry Fallback] Manual extraction failed for: ${stepDescriptionToParse}`);
        }
      }
    }

    // Heuristic: If the parsed step is a navigation with no explicit URL, attempt to derive one.
    if (initialStepObject && initialStepObject.action === 'navigate') {
      let navTarget = initialStepObject.target || '';
      const promptForBaseUrl = async (): Promise<string> => {
        const inquirer = await import('inquirer');
        const answer = await inquirer.default.prompt([
          {
            type: 'input',
            name: 'base',
            message: 'Base URL (e.g., https://example.com):',
            validate: (input: string) =>
              /^https?:\/\//i.test(input) || 'Please enter a valid http(s) URL',
          },
        ]);
        return answer.base as string;
      };

      // Helper to slugify a page name -> "/login"
      const pageNameToPath = (name: string): string => {
        const slug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .replace(/-page$/, '') // remove trailing "-page" if present
          .replace(/-screen$/, '') // common synonyms
          .replace(/-view$/, '');
        if (slug === 'login') {
          return '';
        }
        return `/${slug || ''}`;
      };

      if (!navTarget) {
        // Pattern: "navigate to the login page" or "navigate to login page"
        const pageMatch = stepDescription.match(/navigate\s+to\s+(?:the\s+)?([a-zA-Z0-9\s-]+?)(?:\s+page)?(?:\s|$)/i);
        if (pageMatch && pageMatch[1]) {
          navTarget = pageNameToPath(pageMatch[1]);
        }

        // Pattern: "via src/components/Login.tsx" – extract file name
        const viaMatch = stepDescription.match(/via\s+([^\s]+\.(?:tsx?|jsx?|html?))/i);
        if (!navTarget && viaMatch && viaMatch[1]) {
          const fileName = viaMatch[1].split(/[\\/]/).pop() || '';
          const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
          navTarget = pageNameToPath(nameWithoutExt);
        }
      }

      // Determine the effective base URL (priority: provided => persisted => prompt)
      let effectiveBase = baseUrl || this.baseUrlGlobal;
      if (!effectiveBase) {
        // Interactive prompt (only first time)
        this.addLog('[Base URL Prompt] Asking user for base URL because it is not set.');
        effectiveBase = await promptForBaseUrl();
        this.baseUrlGlobal = effectiveBase; // Persist for remainder of session
      }

      // If navTarget is still empty or just '/', rely on effectiveBase
      if (!navTarget || navTarget === '/') {
        navTarget = effectiveBase;
      } else if (!/^https?:\/\//i.test(navTarget)) {
        // If navTarget is relative and baseUrl provided, prefix it
        if (effectiveBase) {
          navTarget = `${effectiveBase.replace(/\/$/, '')}/${navTarget.replace(/^\//, '')}`;
        }
      }

      // Update target in place so downstream execution uses the derived URL
      initialStepObject.target = navTarget;
    }

    if (!initialStepObject || !initialStepObject.action) {
      const message = `Step ${stepNumber} could not be parsed or action not identified: "${stepDescriptionToParse}"`;
      this.addLog(`[Error] ${message}`);
      result = { status: 'failed', message, duration: Date.now() - stepStartTime };
      return result;
    }

    const currentStepObject = initialStepObject;

    try {
      let actionDescription = currentStepObject.action;
      if (currentStepObject.target) {
        actionDescription += ` on "${String(currentStepObject.target).substring(0, 50)}"`;
      }
      if (currentStepObject.value) {
        actionDescription += ` with value "${String(currentStepObject.value).substring(
          0,
          30
        )}"`;
      }
      this.addLog(`[Step] Executing (Attempt ${attempt}): ${actionDescription}`);

      const disableFallbacks = attempt < MAX_AI_SUGGESTION_ATTEMPTS || !this.aiOptimizationEnabled;
      result = await this.executeStep(currentStepObject, overallExpectedResult, disableFallbacks);
      result.duration = Date.now() - stepStartTime;
      this.addLog(
        `[Step] Result for "${currentStepObject.action}" (Attempt ${attempt}): ${
          result.status
        }, Message: ${result.message?.substring(0, 100)}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.addLog(
          `[Step] Error executing step ${stepNumber} ("${currentStepObject.action}") (Attempt ${attempt}): ${error.message.substring(
            0,
            150
          )}`
        );
        result = {
          status: 'failed',
          message: error.message,
          duration: Date.now() - stepStartTime,
        };
      } else {
        result = {
          status: 'failed',
          message: 'Unknown execution error',
          duration: Date.now() - stepStartTime,
        };
      }
    }

    if (
      result.status === 'failed' &&
      this.aiOptimizationEnabled &&
      attempt < MAX_AI_SUGGESTION_ATTEMPTS
    ) {
      this.addLog(
        `[AI] Step ${stepNumber} failed (Action: "${currentStepObject.action}", Target: "${
          currentStepObject.target || 'N/A'
        }"). Attempting AI suggestion (${attempt + 1}/${MAX_AI_SUGGESTION_ATTEMPTS}).`
      );

      const originalActionWasNavigate =
        currentStepObject.originalStep?.toLowerCase().startsWith('navigate to ') ||
        stepDescription.toLowerCase().startsWith('navigate to ');

      if (originalActionWasNavigate) {
        this.addLog(
          '[AI] Failed action appears to be "navigate". Skipping AI selector suggestion for URL issues.'
        );
        return result;
      }

      if (!this.page) {
        this.addLog('[AI] Page not available for capturing DOM context. Skipping AI suggestion.');
        return result;
      }

      let detailedPageContext = 'DOM snapshot unavailable';
      try {
        this.addLog('[AI] Capturing DOM context for suggestion...');
        const failedSelectorForContext =
          typeof currentStepObject.target === 'string' ? currentStepObject.target : null;

        detailedPageContext = await this.page.evaluate((passedFailedSelector) => {
          const MAX_ELEMENTS_CTX = 50;
          const MAX_ATTR_LENGTH_CTX = 30;
          const MAX_TEXT_LENGTH_CTX = 50;
          const MAX_TOTAL_STRING_LENGTH = 5000;

          function truncateCtx(str: string | null | undefined, len: number): string {
            if (!str) return '';
            return str.length > len ? str.substring(0, len - 3) + '...' : str;
          }

          let elementCount = 0;

          function elementToStringCtx(el: Element | null): string {
            if (!el || elementCount >= MAX_ELEMENTS_CTX) return '';
            elementCount++;
            const tagName = el.tagName.toLowerCase();
            let attrs = '';
            for (let i = 0; i < el.attributes.length; i++) {
              const attr = el.attributes[i];
              if (
                attr.name === 'style' ||
                attr.name.startsWith('on') ||
                attr.name === 'd' ||
                attr.name === 'stroke-width' ||
                (attr.name.startsWith('aria-') && attr.value.length > 70)
              ) {
                continue;
              }
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
                if (
                  childNode.nodeType === Node.TEXT_NODE &&
                  childNode.textContent?.trim()
                ) {
                  directText += childNode.textContent.trim() + ' ';
                }
              }
              if (directText.trim()) {
                textContent = truncateCtx(directText.trim(), MAX_TEXT_LENGTH_CTX);
              }
            }
            if (
              !childrenString &&
              !textContent &&
              [
                'p',
                'span',
                'div',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'a',
                'button',
                'label',
                'td',
                'th',
                'li',
              ].includes(tagName)
            ) {
              const ownText = (el as HTMLElement).innerText?.trim();
              if (ownText) {
                textContent = truncateCtx(ownText, MAX_TEXT_LENGTH_CTX * 2);
              }
            }
            return `<${tagName}${attrs}>${textContent}${childrenString}</${tagName}>`;
          }

          let rootElement: Element | null = null;
          if (
            passedFailedSelector &&
            typeof passedFailedSelector === 'string' &&
            passedFailedSelector.toLowerCase().startsWith('(css:')
          ) {
            const cssSelector = passedFailedSelector.substring(5, passedFailedSelector.length - 1).trim();
            if (cssSelector) {
              const parts = cssSelector.split(/\s+/);
              for (let i = parts.length - 1; i > 0; i--) {
                const candidateSelector = parts.slice(0, i).join(' ');
                if (
                  candidateSelector.trim() === '>' ||
                  candidateSelector.trim() === '+' ||
                  candidateSelector.trim() === '~' ||
                  candidateSelector.trim() === ''
                ) {
                  continue;
                }
                try {
                  const el = document.querySelector(candidateSelector);
                  if (el) {
                    rootElement = el;
                    break;
                  }
                } catch {
                  // ignore invalid intermediate selector
                }
              }
            }
          }

          if (!rootElement) {
            rootElement = document.querySelector('main') || document.body;
          }

          elementCount = 0;
          let fullHtml = elementToStringCtx(rootElement);

          if (fullHtml.length > MAX_TOTAL_STRING_LENGTH) {
            const lastClosingTag = fullHtml.lastIndexOf('</', MAX_TOTAL_STRING_LENGTH);
            if (lastClosingTag !== -1) {
              const endOfTag = fullHtml.indexOf('>', lastClosingTag);
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
        }, failedSelectorForContext);

        this.addLog(
          `[AI] Captured DOM context (length: ${detailedPageContext.length}). Preview: ${detailedPageContext
            .substring(0, 100)
            .replace(/\n/g, ' ')}...`
        );
      } catch (contextError: unknown) {
        if (contextError instanceof Error) {
          this.addLog(
            `[AI] Failed to capture DOM context: ${contextError.message.substring(0, 100)}...`
          );
        }
        detailedPageContext = `Page URL: ${this.page.url() || 'unknown'}`;
      }

      try {
        const descriptiveTermForSuggestion =
          typeof currentStepObject.target === 'string'
            ? currentStepObject.target
            : stepDescription;
        this.addLog(
          `[AI] Requesting selector suggestion for target: "${currentStepObject.target ||
            'N/A'}", descriptive: "${descriptiveTermForSuggestion.substring(0, 70)}"`
        );

        const selectorParam =
          typeof currentStepObject.target === 'string' ? currentStepObject.target : '';
        if (
          !selectorParam &&
          currentStepObject.action !== 'navigate' &&
          currentStepObject.action !== 'wait'
        ) {
          this.addLog(
            `[AI] Warning: Failed step target is not a string or is empty ('${selectorParam}'). AI suggestion might be less effective.`
          );
        }

        const selectorSuggestionResponse = await this.retryApiCall(
          () =>
            apiClient.getDynamicSelectorSuggestion({
              failedSelector: selectorParam,
              descriptiveTerm: descriptiveTermForSuggestion,
              pageUrl: this.page?.url() || '',
              domSnippet: detailedPageContext,
              originalStep: stepDescription,
            }),
          MAX_RETRY_ATTEMPTS,
          BASE_RETRY_DELAY_MS,
          `get dynamic selector for step ${stepNumber}, attempt ${attempt + 1}`
        );

        if (
          selectorSuggestionResponse.success &&
          selectorSuggestionResponse.data &&
          selectorSuggestionResponse.data.suggestedSelector
        ) {
          const aiData = selectorSuggestionResponse.data;
          const aiConfidence = (aiData as any).confidence;
          const aiReasoning = (aiData as any).reasoning;
          const aiSuggestedSelector = aiData.suggestedSelector;
          const aiSuggestedStrategy = aiData.suggestedStrategy;
          this.addLog(
            `[AI] Received selector suggestion: "${aiSuggestedSelector}" (Strategy: ${
              aiSuggestedStrategy || 'N/A'
            }, Confidence: ${aiConfidence || 'N/A'}, Reasoning: ${aiReasoning || 'N/A'})`
          );

          const originalStepAction = currentStepObject.action;
          const strategyToUse = aiSuggestedStrategy || 'css';
          let selectorValueForHint = aiSuggestedSelector;

          if (selectorValueForHint.startsWith(strategyToUse + ':')) {
            selectorValueForHint = selectorValueForHint.substring(
              (strategyToUse + ':').length
            );
          }
          if (selectorValueForHint.startsWith('css:') && strategyToUse === 'css') {
            selectorValueForHint = selectorValueForHint.substring('css:'.length);
          } else if (
            selectorValueForHint.startsWith('xpath:') &&
            strategyToUse === 'xpath'
          ) {
            selectorValueForHint = selectorValueForHint.substring('xpath:'.length);
          }

          let escapedSelectorValue = JSON.stringify(selectorValueForHint);
          if (
            escapedSelectorValue.startsWith('"') &&
            escapedSelectorValue.endsWith('"')
          ) {
            escapedSelectorValue = escapedSelectorValue.substring(
              1,
              escapedSelectorValue.length - 1
            );
          }

          let finalAiSelectorForReconstructionInHintFormat = `(${strategyToUse}: ${escapedSelectorValue})`;

          if (strategyToUse === 'xpath') {
            finalAiSelectorForReconstructionInHintFormat = `(${strategyToUse}: ${escapedSelectorValue})`;
          }

          let aiReconstructedStepString: string;

          if (
            originalStepAction === 'assert' &&
            currentStepObject.target
          ) {
            const originalAssertionDetails = currentStepObject.target.match(
              /type="([^"]+)", selector="([^"]+)", expected="([^"]*)", condition="([^"]+)"/
            );
            if (originalAssertionDetails) {
              const [, assertType, , assertExpected, assertCondition] = originalAssertionDetails;
              const aiSelectorInHint = `(type=${strategyToUse}, selector=${finalAiSelectorForReconstructionInHintFormat})`;
              aiReconstructedStepString = `assert "(type=${assertType}, selector=${aiSelectorInHint}, expected=${assertExpected}, condition=${assertCondition})"`;
              this.addLog(
                `[AI] Reconstructed assertion step (complex): ${aiReconstructedStepString}`
              );
            } else {
              this.addLog(
                `[AI] Could not parse original assertion details from target: "${currentStepObject.target}". Defaulting to click.`
              );
              aiReconstructedStepString = `click "${finalAiSelectorForReconstructionInHintFormat}"`;
            }
          } else if (
            originalStepAction === 'dragAndDrop' &&
            currentStepObject.target &&
            currentStepObject.destinationTarget
          ) {
            const originalDestinationSelector = currentStepObject.destinationTarget;
            aiReconstructedStepString = `drag "${finalAiSelectorForReconstructionInHintFormat}" to "${originalDestinationSelector}"`;
            this.addLog(
              `[AI] Reconstructed dragAndDrop step: ${aiReconstructedStepString}`
            );
          } else {
            aiReconstructedStepString = `${originalStepAction} ${finalAiSelectorForReconstructionInHintFormat}`;
            if (
              currentStepObject.value &&
              (originalStepAction === 'type' || originalStepAction === 'select')
            ) {
              aiReconstructedStepString += ` with value "${currentStepObject.value}"`;
            }
          }

          this.addLog(
            `[AI] Attempt ${attempt + 1}: Retrying with AI suggested step: "${aiReconstructedStepString.substring(
              0,
              150
            )}..."`
          );
          return this._processSingleStep(
            aiReconstructedStepString,
            baseUrl,
            stepNumber,
            overallExpectedResult,
            attempt + 1
          );
        } else {
          this.addLog(
            `[AI] Selector suggestion failed or no selector provided. Error: ${
              selectorSuggestionResponse.error || 'No selector in response'
            }. Raw: ${JSON.stringify(selectorSuggestionResponse).substring(0, 100)}`
          );
        }
      } catch (aiError: unknown) {
        if (aiError instanceof Error) {
          this.addLog(
            `[AI] Error during selector suggestion attempt: ${aiError.message.substring(
              0,
              150
            )}`
          );
        }
      }
    }

    return result;
  }

  private async executeStep(
    parsedStep: ParsedTestStep,
    overallTestCaseExpectedResult?: string,
    disableFallbacksForAiRetry = false
  ): Promise<TestResult> {
    if (!this.page || !this.currentFrame) {
      throw new Error('Page or currentFrame not initialized');
    }
    const stepStartTime = Date.now();
    let status: 'passed' | 'failed' = 'failed';
    let message: string | undefined;
    let screenshot: string | undefined;
    let failureType: 'elementNotFound' | 'actionFailed' | 'other' | undefined;

    this.addLog(
      `[Action] ${parsedStep.action}: ${parsedStep.target?.substring(0, 30) || 'N/A'}...`
    );

    try {
      const disableFallbacks = disableFallbacksForAiRetry || !this.aiOptimizationEnabled;
      await this._dispatchStepAction(parsedStep, overallTestCaseExpectedResult, disableFallbacks);
      status = 'passed';
      this.addLog(`[Action] ${parsedStep.action} successful.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.addLog(
          `[Action] ${parsedStep.action} failed: ${error.message.substring(0, 50)}...`
        );
        // Add warning for click actions with generic selectors
        if (parsedStep.action === 'click' && parsedStep.target && 
            !parsedStep.target.includes('#') && !parsedStep.target.includes('.') && 
            !parsedStep.target.includes('[') && parsedStep.target.length < 20) {
          this.addLog(
            `[Warning] The target '${parsedStep.target}' for click action may be too generic. Consider specifying a selector like '#id' or '.class' for better accuracy.`
          );
        }
        status = 'failed';
        message = error.message;
        // Categorize failure type
        if (message.includes('not found') || message.includes('No element matching')) {
          failureType = 'elementNotFound';
          this.addLog('[Failure Type] Element not found.');
        } else if (message.includes('failed to perform') || message.includes('action not performed')) {
          failureType = 'actionFailed';
          this.addLog('[Failure Type] Action not performed as expected.');
        } else {
          failureType = 'other';
          this.addLog('[Failure Type] Other error during action execution.');
        }
        try {
          screenshot = await this.page.screenshot({ encoding: 'base64' });
        } catch (screenshotError: unknown) {
          if (screenshotError instanceof Error) {
            this.addLog('[Action] Failed to take screenshot.', { message: screenshotError.message });
          }
        }
      } else {
        message = 'Unknown action error';
        failureType = 'other';
      }
    }

    return {
      status,
      message,
      screenshot,
      failureType,
      duration: Date.now() - stepStartTime,
    };
  }

  private async _dispatchStepAction(
    parsedStep: ParsedTestStep,
    overallTestCaseExpectedResult?: string,
    disableFallbacks = false
  ): Promise<void> {
    if (!this.page || !this.currentFrame) {
      throw new Error('Page or frame not initialized for dispatching action.');
    }

    const { action, target, value, timeout, assertionType, assertion } = parsedStep;
    this.addLog(
      `Dispatching action: ${action}, Target: ${
        target ? target.toString().substring(0, 50) : 'N/A'
      }, Value: ${value ? value.substring(0, 50) : 'N/A'}`
    );

    const commonParams = {
      page: this.page,
      frame: this.currentFrame,
      addLog: this.addLog,
      parsedStep,
      overallTestCaseExpectedResult,
      baseUrl: '',
      disableFallbacksForAiRetry: disableFallbacks,
      apiClient: apiClient,
    };

    try {
      switch (parsedStep.action) {
        case 'navigate':
          if (!this.page || !this.currentFrame) {
            this.addLog(`[Recovery] Page/frame not initialized. Reinitializing...`);
            await this.initialize();
          }
          if (!this.page || !this.currentFrame) {
            throw new Error('Page or currentFrame still not initialized after recovery attempt.');
          }
          {
            let navigationUrl = parsedStep.target || '';
            if (!navigationUrl && parsedStep.originalStep?.toLowerCase().includes('e-commerce')) {
              navigationUrl = 'https://www.saucedemo.com/';
              this.addLog(`[Default URL] Using default e-commerce URL: ${navigationUrl}`);
            }
            if (!navigationUrl) {
              throw new Error('Navigation URL not provided');
            }
            const newFrameContext = await actionHandlers.handleNavigate(
              this.page,
              this.currentFrame,
              this.addLog,
              navigationUrl
            );
            if (newFrameContext) {
              this.currentFrame = newFrameContext;
            }
          }
          break;

        case 'click':
          this.addLog(`[Action] click: ${parsedStep.target}...`);
          if (parsedStep.target && parsedStep.target.includes('Open Modal')) {
            this.addLog('[W3Schools Pre-Click] Adding a wait for modal button to load.');
            await new Promise((resolve) => setTimeout(resolve, 10000));
          }
          await actionHandlers.handleClick(
            this.page,
            this.currentFrame,
            this.addLog,
            parsedStep.target || '',
            'false'
          );
          break;

        case 'type':
          if (process.env.NODE_ENV === 'development') {
            this.addLog(`[Type Action Debug] Selector being passed to handleType: ${parsedStep.target || 'N/A'}`);
            this.addLog(`[Type Action Debug] Full parsedStep object: Action=${parsedStep.action}, Target=${parsedStep.target || 'N/A'}, Value=${parsedStep.value || 'N/A'}, OriginalStep=${parsedStep.originalStep || 'N/A'}`);
          }
          await actionHandlers.handleType(
            this.page,
            this.currentFrame,
            this.addLog,
            parsedStep.target || '',
            parsedStep.value || '',
            parsedStep.originalStep || '',
            this.retryApiCall.bind(this)
          );
          break;

        case 'wait': {
          let waitArg: string | number | undefined;
          if (parsedStep.target) {
            waitArg = parsedStep.target as string;
          } else if (typeof parsedStep.timeout === 'number') {
            waitArg = parsedStep.timeout;
          }
          await actionHandlers.handleWait(
            this.currentFrame || this.page,
            this.addLog,
            waitArg,
            typeof parsedStep.timeout === 'number' ? parsedStep.timeout : 10000
          );
          break;
        }

        case 'assert':
          if (!this.page) {
            throw new Error('Page not initialized for assertion');
          }
          if (!this.currentFrame) {
            throw new Error('Current frame not initialized for assertion');
          }
          await actionHandlers.handleAssertion(this.page, this.currentFrame, this.addLog, parsedStep);
          break;

        case 'select':
          await actionHandlers.handleSelect(
            this.page,
            this.currentFrame,
            this.addLog,
            parsedStep.target || '',
            parsedStep.value || '',
            parsedStep.originalStep || '',
            this.retryApiCall.bind(this)
          );
          break;

        case 'hover':
          await actionHandlers.handleHover(
            this.page,
            this.currentFrame,
            this.addLog,
            parsedStep.target || '',
            parsedStep.originalStep || '',
            this.retryApiCall.bind(this)
          );
          break;

        case 'scroll':
          await actionHandlers.handleScroll(
            this.page,
            this.currentFrame,
            this.addLog,
            parsedStep.target || '',
            parsedStep.originalStep || '',
            this.retryApiCall.bind(this)
          );
          break;

        case 'upload':
          {
            let uploadSelector = parsedStep.target || '';
            if (
              parsedStep.originalStep &&
              parsedStep.target &&
              typeof parsedStep.target === 'string'
            ) {
              const uploadPattern = /upload file.*?to element\s+"([^"]+)"/i;
              const match = uploadPattern.exec(parsedStep.originalStep);
              if (match && match[1]) {
                const selectorFromOriginalStep = match[1];
                const hasHintInOriginal = /^\((?:css|xpath|id|name|text|value|aria|placeholder|title|data):/i.test(
                  selectorFromOriginalStep
                );
                const hasHintInParsed = /^\((?:css|xpath|id|name|text|value|aria|placeholder|title|data):/i.test(
                  parsedStep.target
                );
                if (hasHintInOriginal && !hasHintInParsed) {
                  this.addLog(
                    `[Upload] Using original selector: ${selectorFromOriginalStep.substring(0, 30)}...`
                  );
                  uploadSelector = selectorFromOriginalStep;
                } else if (hasHintInOriginal === hasHintInParsed && selectorFromOriginalStep !== parsedStep.target) {
                  this.addLog(
                    `[Upload] Original (${selectorFromOriginalStep.substring(
                      0,
                      30
                    )}...) and parsed (${parsedStep.target.substring(0, 30)}...) differ. Using parsed.`
                  );
                }
              }
            }
            const filePathToUpload =
              parsedStep.filePath || (await this.searchForFile());
            this.addLog(`[Upload] Attempting to upload file: ${filePathToUpload}`);
            await actionHandlers.handleUpload(
              this.page,
              this.currentFrame,
              this.addLog,
              uploadSelector,
              filePathToUpload,
              parsedStep.originalStep || '',
              this.retryApiCall.bind(this)
            );
            this.addLog(`[Upload] Upload action completed for file: ${filePathToUpload}`);
            // Validate upload success
            try {
              const uploadConfirmationSelector = '#uploaded-files';
              await this.page.waitForSelector(uploadConfirmationSelector, {
                timeout: 5000,
              });
              const uploadedFileName = await this.page.evaluate((sel) => {
                const el = document.querySelector(sel);
                return el && el.textContent ? el.textContent.trim() : '';
              }, uploadConfirmationSelector);
              this.addLog(`[Upload Validation] Upload confirmed. File name displayed: ${uploadedFileName}`);
            } catch (validationError: unknown) {
              if (validationError instanceof Error) {
                this.addLog(`[Upload Validation] Failed to confirm upload: ${validationError.message}`);
              }
              throw new Error(`Upload performed but confirmation not found.`);
            }
          }
          break;

        case 'dragAndDrop':
          if (!target) {
            throw new Error('Drag and drop requires a source selector');
          }
          if (!parsedStep.destinationTarget) {
            throw new Error('Drag and drop requires a destination selector');
          }
          if (this.aiOptimizationEnabled) {
            await actionHandlers.handleDragAndDropV2(
              this.page,
              this.currentFrame,
              this.addLog,
              target,
              parsedStep.destinationTarget,
              parsedStep.originalStep || '',
              this.retryApiCall.bind(this)
            );
          } else {
            await actionHandlers.handleDragAndDrop(
              this.page,
              this.currentFrame,
              this.addLog,
              target,
              parsedStep.destinationTarget,
              parsedStep.originalStep || '',
              this.retryApiCall.bind(this)
            );
          }
          break;

        case 'switchToIframe':
          this.addLog(`[SwitchToIframe] Looking for iframe: "${parsedStep.target || 'N/A'}"`);
          {
            let iframeFound = false;
            try {
              const frames = this.page.frames();
              this.addLog(`[SwitchToIframe] Total frames found: ${frames.length}`);
              for (const frame of frames) {
                try {
                  const frameElement = await frame.frameElement();
                  if (frameElement) {
                    const className = await frameElement.evaluate(
                      (el) => el.getAttribute('class') || '',
                      frameElement
                    );
                    const id = await frameElement.evaluate(
                      (el) => el.getAttribute('id') || '',
                      frameElement
                    );
                    const src = await frameElement.evaluate(
                      (el) => el.getAttribute('src') || '',
                      frameElement
                    );
                    this.addLog(
                      `[SwitchToIframe] Frame details - ID: ${id}, Class: ${className}, Src: ${src}`
                    );
                    if (
                      (parsedStep.target &&
                        (parsedStep.target === id ||
                          parsedStep.target === className ||
                          parsedStep.target === src)) ||
                      (!parsedStep.target && src)
                    ) {
                      this.currentFrame = frame;
                      this.addLog(
                        `[SwitchToIframe] Switched to frame: ID=${id}, Class=${className}, Src=${src}`
                      );
                      iframeFound = true;
                      break;
                    }
                  }
                } catch (frameError: unknown) {
                  if (frameError instanceof Error) {
                    this.addLog(`[SwitchToIframe] Error checking frame: ${frameError.message}`);
                  }
                }
              }
              if (!iframeFound) {
                this.addLog('[SwitchToIframe] Iframe not found, staying on main frame');
              }
            } catch (error: unknown) {
              if (error instanceof Error) {
                this.addLog(`[SwitchToIframe] Error while searching for iframe: ${error.message}`);
              }
            }
          }
          break;

        case 'switchToMainContent':
          await actionHandlers.handleSwitchToMainContent(this.page, this.currentFrame as any);
          if (this.page) {
            this.currentFrame = this.page;
            this.addLog('[SwitchToMainContent] Switched back to main frame');
          }
          break;

        case 'skip':
          await actionHandlers.handleSkip(
            this.currentFrame || this.page,
            this.addLog,
            parsedStep.originalStep
          );
          break;

        default:
          this.addLog(`Unsupported action: ${parsedStep.action}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.addLog(`[Action] Error in ${parsedStep.action}: ${error.message.substring(0, 50)}...`);
        if (
          error.message.includes('detached Frame') ||
          error.name === 'TargetCloseError'
        ) {
          this.addLog('[Recovery] Frame detached. Restarting browser...');
          if (this.browser) {
            await this.browser.close().catch((e: unknown) => {
              if (e instanceof Error) {
                this.addLog(`[Recovery] Error closing: ${e.message.substring(0, 50)}...`);
              }
            });
            this.browser = null;
            this.page = null;
            this.currentFrame = null;
          }
          await this.initialize();
          this.addLog('[Recovery] Browser restarted during action.');
          throw new Error('Browser restarted due to detachment. Retry.');
        }
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
        if (
          !response.success &&
          ((response.error?.includes('rate limit') || response.error?.includes('429')) !== false)
        ) {
          retryCount++;
          if (retryCount === maxRetries) {
            this.addLog(
              `[AI] Rate limit for ${callDescription}. Max retries (${maxRetries}) reached.`
            );
            throw new Error(`[AI] Max retries reached for ${callDescription}.`);
          }
          await new Promise((resolve) => setTimeout(resolve, baseDelayMs));
          continue;
        }
        return response;
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.addLog(
            `[AI] Error during retry attempt for ${callDescription}: ${error.message.substring(
              0,
              150
            )}`
          );
        }
        retryCount++;
        if (retryCount === maxRetries) {
          throw new Error(`[AI] Max retries reached for ${callDescription}.`);
        }
        await new Promise((resolve) => setTimeout(resolve, baseDelayMs));
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
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.addLog('Error closing browser during cleanup:', { message: error.message });
        }
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

  private async searchForFile(): Promise<string> {
    const fsPromises = fs.promises;
    const commonDirectories = [
      path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads'),
      path.join(process.env.USERPROFILE || process.env.HOME || '', 'Desktop'),
      path.join(process.env.USERPROFILE || process.env.HOME || '', 'Documents'),
    ];
    const fileExtensions = ['.txt', '.jpg', '.png', '.pdf'];
    this.addLog('[File Search] Starting search for a suitable file in common directories...');
    for (const dir of commonDirectories) {
      this.addLog(`[File Search] Checking directory: ${dir}`);
      try {
        const files = await fsPromises.readdir(dir);
        this.addLog(`[File Search] Found ${files.length} items in ${dir}`);
        for (const file of files.slice(0, 10)) {
          const filePath = path.join(dir, file);
          try {
            const stat = await fsPromises.stat(filePath);
            if (
              stat.isFile() &&
              fileExtensions.some((ext) => file.toLowerCase().endsWith(ext))
            ) {
              this.addLog(`[File Search] Selected file: ${filePath}`);
              return filePath;
            } else {
              this.addLog(
                `[File Search] Skipping ${filePath} - not a matching file type or not a file`
              );
            }
          } catch (fileError: unknown) {
            if (fileError instanceof Error) {
              this.addLog(
                `[File Search] Error checking file ${filePath}: ${fileError.message}`
              );
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          this.addLog(`[File Search] Error searching in ${dir}: ${error.message}`);
        }
      }
    }
    this.addLog(
      '[File Search] No suitable file found in common directories. Falling back to default.'
    );
    return 'C:\\temp\\sample-test-upload.txt';
  }
}
