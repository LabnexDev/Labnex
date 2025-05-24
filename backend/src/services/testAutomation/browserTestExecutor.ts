import puppeteer, { Browser, Page } from 'puppeteer';
import { TestStepParser, ParsedTestStep } from './testStepParser';

export interface TestExecutionResult {
  status: 'pass' | 'fail';
  message?: string;
  error?: string;
  screenshot?: string;
  logs?: string[];
  duration: number;
}

export interface TestCaseData {
  title: string;
  description: string;
  steps: string[];
  expectedResult: string;
}

export class BrowserTestExecutor {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private logs: string[] = [];

    async initialize(): Promise<void> {
    try {
      // Determine if we're in production (Render) or development
      const isProduction = process.env.NODE_ENV === 'production';
      
      // EXTREME memory optimization for Render free tier (512MB)
      const chromeArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-web-security',
        '--single-process',
        '--no-zygote',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-features=VizDisplayCompositor',
        '--disable-features=VizServiceDisplayCompositor',
        '--disable-software-rasterizer',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-sync',
        '--disable-translate',
                '--disable-plugins',        '--disable-java',        '--disable-flash',
        '--memory-pressure-off',
        '--max_old_space_size=256',
        '--aggressive-cache-discard',
        '--no-first-run'
      ];

      // Log the attempt with memory warning
      this.addLog(`⚠️ RENDER FREE TIER: Only 512MB RAM available!`);
      this.addLog(`Attempting to launch browser in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
      
      const launchOptions: any = {
        headless: isProduction,
        args: chromeArgs,
        timeout: 60000 // Increase timeout for slow CPU
      };

      // Try to use custom executable path in production
      if (isProduction && process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        this.addLog(`Using custom Chrome executable: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
      }

      this.browser = await puppeteer.launch(launchOptions);

      if (!this.browser) {
        throw new Error('Failed to launch browser');
      }

      this.page = await this.browser.newPage();
      
      // Reduce memory usage
      await this.page.setViewport({ width: 800, height: 600 }); // Smaller viewport
      await this.page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

      this.page.on('console', (msg) => {
        this.logs.push(`Console ${msg.type()}: ${msg.text()}`);
      });

      this.page.on('pageerror', (error) => {
        this.logs.push(`Page Error: ${error.message}`);
      });

      this.addLog(`✅ Browser initialized successfully - ${isProduction ? 'HEADLESS MODE (Production)' : 'VISIBLE MODE (Development)'}`);
      this.addLog(`⚠️ Running on Render FREE TIER - Limited resources may cause timeouts`);
    } catch (error: any) {
      this.addLog(`❌ Failed to initialize browser: ${error.message}`);
      this.addLog(`💡 This is likely due to Render's 512MB memory limit`);
      throw new Error(`Failed to initialize browser: ${error.message}`);
    }
  }

  async executeTestCase(testCase: TestCaseData): Promise<TestExecutionResult> {
    const startTime = Date.now();
    this.logs = [];

    try {
      if (!this.page) {
        await this.initialize();
      }

      this.addLog(`Starting test: ${testCase.title}`);

      for (let i = 0; i < testCase.steps.length; i++) {
        const step = testCase.steps[i];
        this.addLog(`Executing step ${i + 1}: ${step}`);
        
        const parsedStep = TestStepParser.parseStep(step);
        await this.executeStep(parsedStep);
        
        await this.page!.waitForFunction(() => true, { timeout: 500 }).catch(() => {});
      }

      const validationResult = await this.validateExpectedResult(testCase.expectedResult);
      const duration = Date.now() - startTime;

      if (validationResult.isValid) {
        this.addLog(`Test passed: ${testCase.title}`);
        return {
          status: 'pass',
          message: 'Test completed successfully',
          logs: this.logs,
          duration
        };
      } else {
        this.addLog(`Test failed: ${validationResult.reason}`);
        const screenshot = await this.takeScreenshot();
        return {
          status: 'fail',
          message: 'Test failed validation',
          error: validationResult.reason,
          screenshot,
          logs: this.logs,
          duration
        };
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.addLog(`Test error: ${error.message}`);
      const screenshot = await this.takeScreenshot();
      
      return {
        status: 'fail',
        message: 'Test execution failed',
        error: error.message,
        screenshot,
        logs: this.logs,
        duration
      };
    }
  }

  private async executeStep(step: ParsedTestStep): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    try {
      switch (step.action) {
        case 'navigate':
          await this.handleNavigate(step);
          break;
        case 'click':
          await this.handleClick(step);
          break;
        case 'type':
          await this.handleType(step);
          break;
        case 'wait':
          await this.handleWait(step);
          break;
        case 'assert':
          await this.handleAssert(step);
          break;
        case 'select':
          await this.handleSelect(step);
          break;
        case 'scroll':
          await this.handleScroll(step);
          break;
        case 'hover':
          await this.handleHover(step);
          break;
        default:
          this.addLog(`Unknown action: ${step.action}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to execute step "${step.originalStep}": ${error.message}`);
    }
  }

  private async handleNavigate(step: ParsedTestStep): Promise<void> {
    if (!step.target) throw new Error('No URL provided for navigation');
    
    let url = step.target;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    this.addLog(`Navigating to: ${url}`);
    
    try {
      await this.page!.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });
      
      await this.page!.waitForFunction(() => document.readyState === 'complete', { timeout: 10000 }).catch(() => {
        this.addLog('Page did not reach complete state, but continuing...');
      });
      
      this.addLog(`Successfully navigated to: ${url}`);
    } catch (error: any) {
      this.addLog(`Initial navigation failed: ${error.message}`);
      this.addLog('Trying with basic timeout...');
      
      try {
        await this.page!.goto(url, { 
          waitUntil: 'load',
          timeout: 30000 
        });
        this.addLog(`Navigation succeeded with basic timeout`);
      } catch (secondError: any) {
        throw new Error(`Navigation failed after retries: ${secondError.message}`);
      }
    }
  }

  private async handleClick(step: ParsedTestStep): Promise<void> {
    if (!step.target) throw new Error('No target provided for click');

    this.addLog(`Clicking on: ${step.target}`);
    
    const selectors = this.generateSelectors(step.target);
    
    for (const selector of selectors) {
      try {
        await this.page!.waitForSelector(selector, { timeout: 5000 });
        await this.page!.click(selector);
        this.addLog(`Successfully clicked: ${selector}`);
        return;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`Could not find clickable element: ${step.target}`);
  }

  private async handleType(step: ParsedTestStep): Promise<void> {
    if (!step.target || !step.value) throw new Error('Missing target or value for typing');

    this.addLog(`Typing "${step.value}" into: ${step.target}`);
    
    const selectors = this.generateSelectors(step.target);
    
    for (const selector of selectors) {
      try {
        await this.page!.waitForSelector(selector, { timeout: 5000 });
        await this.page!.focus(selector);
        await this.page!.evaluate((sel) => {
          const element = document.querySelector(sel) as HTMLInputElement;
          if (element) element.value = '';
        }, selector);
        await this.page!.type(selector, step.value);
        this.addLog(`Successfully typed into: ${selector}`);
        return;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`Could not find input element: ${step.target}`);
  }

  private async handleWait(step: ParsedTestStep): Promise<void> {
    const timeout = step.timeout || 3000;
    this.addLog(`Waiting for ${timeout}ms`);
    await new Promise(resolve => setTimeout(resolve, timeout));
  }

  // FIXED ASSERT METHOD - Now checks for text content!
  private async handleAssert(step: ParsedTestStep): Promise<void> {
    if (!step.target) throw new Error('No target provided for assertion');
    
    this.addLog(`Asserting presence of: ${step.target}`);
    
    // First, try to find as text content (most common case)
    try {
      const pageText = await this.page!.evaluate(() => document.body.innerText);
      if (pageText.toLowerCase().includes(step.target!.toLowerCase())) {
        this.addLog(`✅ Found text "${step.target}" in page content`);
        return;
      }
    } catch (error) {
      this.addLog(`Could not check page text: ${error}`);
    }

    // Try textContent method too
    try {
      const textFound = await this.page!.evaluate((searchText) => {
        return document.body.textContent?.toLowerCase().includes(searchText.toLowerCase()) || false;
      }, step.target);
      
      if (textFound) {
        this.addLog(`✅ Found text "${step.target}" using textContent search`);
        return;
      }
    } catch (error) {
      this.addLog(`Could not check textContent: ${error}`);
    }
    
    // If not found as text, try as CSS selectors
    const selectors = this.generateSelectors(step.target);
    
    for (const selector of selectors) {
      try {
        await this.page!.waitForSelector(selector, { timeout: 2000 });
        this.addLog(`✅ Found element: ${selector}`);
        return;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`Assertion failed: Could not find "${step.target}" as text or element`);
  }

  private async handleSelect(step: ParsedTestStep): Promise<void> {
    if (!step.target || !step.value) throw new Error('Missing target or value for selection');

    this.addLog(`Selecting "${step.value}" from: ${step.target}`);
    
    const selectors = this.generateSelectors(step.target);
    
    for (const selector of selectors) {
      try {
        await this.page!.waitForSelector(selector, { timeout: 5000 });
        await this.page!.select(selector, step.value);
        this.addLog(`Successfully selected: ${step.value}`);
        return;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`Could not find select element: ${step.target}`);
  }

  private async handleScroll(step: ParsedTestStep): Promise<void> {
    this.addLog(`Scrolling: ${step.target}`);
    
    switch (step.target) {
      case 'top':
        await this.page!.evaluate(() => window.scrollTo(0, 0));
        break;
      case 'bottom':
        await this.page!.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        break;
      case 'up':
        await this.page!.evaluate(() => window.scrollBy(0, -300));
        break;
      case 'down':
      default:
        await this.page!.evaluate(() => window.scrollBy(0, 300));
        break;
    }
  }

  private async handleHover(step: ParsedTestStep): Promise<void> {
    if (!step.target) throw new Error('No target provided for hover');

    this.addLog(`Hovering over: ${step.target}`);
    
    const selectors = this.generateSelectors(step.target);
    
    for (const selector of selectors) {
      try {
        await this.page!.waitForSelector(selector, { timeout: 5000 });
        await this.page!.hover(selector);
        this.addLog(`Successfully hovered: ${selector}`);
        return;
      } catch (error) {
        continue;
      }
    }
    
    throw new Error(`Could not find element to hover: ${step.target}`);
  }

  private generateSelectors(target: string): string[] {
    const selectors: string[] = [];
    
    // If it's already a CSS selector, use it first
    if (target.match(/^[.#\[]/) || target.includes('input') || target.includes('button')) {
      selectors.push(target);
    }
    
    // Enhanced selectors for common search scenarios
    if (target.toLowerCase().includes('search')) {
      selectors.push(
        'input[name="q"]',           // Google search
        'input[name="search"]',      // Wikipedia search  
        'input[type="search"]',      // Generic search input
        'input[placeholder*="search"]', // Search placeholder
        'input[aria-label*="search"]',  // Accessible search
        '#search',                   // Common ID
        '.search-input',             // Common class
        '[data-testid="search"]'     // Test attribute
      );
    }
    
    // Enhanced selectors for buttons
    if (target.toLowerCase().includes('button') || target.toLowerCase().includes('search') || target.toLowerCase().includes('submit')) {
      selectors.push(
        'button[type="submit"]',
        'input[type="submit"]',
        'button[aria-label*="Search"]',
        'button[value*="Search"]',
        `button:contains("${target}")`,
        `input[value*="${target}"]`
      );
    }
    
    // Standard attribute selectors
    selectors.push(
      `[data-testid="${target}"]`,
      `[data-test="${target}"]`, 
      `[id="${target}"]`,
      `[name="${target}"]`,
      `[placeholder*="${target}"]`,
      `[aria-label*="${target}"]`,
      `[title*="${target}"]`,
      `[value*="${target}"]`,
      `[alt*="${target}"]`
    );
    
    return selectors;
  }

  private async validateExpectedResult(expectedResult: string): Promise<{ isValid: boolean; reason?: string }> {
    try {
      this.addLog(`Validating expected result: ${expectedResult}`);
      
      const pageText = await this.page!.evaluate(() => document.body.innerText);
      this.addLog(`Page text (first 200 chars): ${pageText.substring(0, 200)}...`);
      
      if (pageText.toLowerCase().includes(expectedResult.toLowerCase())) {
        this.addLog(`✅ Found expected text "${expectedResult}" in page content`);
        return { isValid: true };
      }
      
      const textFound = await this.page!.evaluate((searchText) => {
        return document.body.textContent?.toLowerCase().includes(searchText.toLowerCase()) || false;
      }, expectedResult);
      
      if (textFound) {
        this.addLog(`✅ Found expected text "${expectedResult}" using textContent search`);
        return { isValid: true };
      }
      
      const currentUrl = this.page!.url();
      if (expectedResult.includes('http') && currentUrl.includes(expectedResult)) {
        this.addLog(`✅ Found expected result in URL: ${currentUrl}`);
        return { isValid: true };
      }
      
      return { 
        isValid: false, 
        reason: `Expected result not found: "${expectedResult}". Page contains: "${pageText.substring(0, 500)}..."` 
      };
      
    } catch (error: any) {
      this.addLog(`Error during validation: ${error.message}`);
      return { 
        isValid: false, 
        reason: `Error validating result: ${error.message}` 
      };
    }
  }

  private async takeScreenshot(): Promise<string | undefined> {
    try {
      if (this.page) {
        const screenshot = await this.page.screenshot({ 
          encoding: 'base64',
          fullPage: true
        });
        return `data:image/png;base64,${screenshot}`;
      }
    } catch (error) {
      this.addLog(`Failed to take screenshot: ${error}`);
    }
    return undefined;
  }

  private addLog(message: string): void {
    const timestamp = new Date().toISOString();
    this.logs.push(`[${timestamp}] ${message}`);
  }

  async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.addLog('Browser cleanup completed');
    } catch (error: any) {
      this.addLog(`Error during cleanup: ${error.message}`);
    }
  }
} 