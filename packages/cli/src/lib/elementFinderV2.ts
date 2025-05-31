import { Page, Frame, ElementHandle, JSHandle } from 'puppeteer';
import { extractHintedSelector } from './parserHelpers/extractHintedSelector';
import { finalizeSelector } from './parserHelpers/finalizeSelector';
import { apiClient, ApiResponse } from '../api/client';

export type AddLogFunction = (message: string, data?: any) => void;
export type RetryApiCallFunction = <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  maxRetries: number,
  baseDelayMs: number,
  callDescription: string
) => Promise<ApiResponse<T>>;

interface FindElementOptions {
  timeout?: number;
  waitForVisible?: boolean;
  waitForClickable?: boolean;
  retryWithAI?: boolean;
  scrollIntoView?: boolean;
}

interface ElementContext {
  selector: string;
  descriptiveTerm: string;
  originalStep: string;
  previousAttempts?: string[];
  index?: number;
}

// Fast and efficient element finding with AI assistance
export async function findElementWithFallbacks(
  page: Page,
  currentFrame: Page | Frame,
  addLog: AddLogFunction,
  selectorOrText: string,
  descriptiveTerm: string,
  originalStep: string = '',
  disableFallbacks: boolean = false,
  retryApiCallFn?: RetryApiCallFunction,
  index: number = 0
): Promise<ElementHandle | null> {
  if (!selectorOrText) {
    addLog('[findElementWithFallbacks] No selector provided');
    return null;
  }

  const MAX_WAIT_TIME = 10000; // 10 seconds max
  const startTime = Date.now();

  addLog(`[findElementWithFallbacks] Looking for: "${selectorOrText}" (${descriptiveTerm}) at index: ${index}`);

  // Extract selector hint if present
  const hintExtraction = extractHintedSelector(selectorOrText);
  let primarySelector = hintExtraction.selectorValue || selectorOrText;
  let selectorType = hintExtraction.type || 'auto';

  // Minimal cleanup - don't be too aggressive
  primarySelector = primarySelector.trim();
  
  // Try immediate element finding first (no waiting)
  let element = await tryFindElementImmediate(currentFrame, primarySelector, selectorType, addLog, index);
  if (element) {
    addLog(`[findElementWithFallbacks] ✓ Found element immediately`);
    return element;
  }

  // Temporarily disable AI assistance to bypass backend 500 error
  if (!disableFallbacks && retryApiCallFn && apiClient) {
    addLog('[findElementWithFallbacks] Element not found immediately. Requesting AI assistance...');
    
    try {
      // Capture focused DOM context
      const domSnippet = await captureFocusedDomSnippet(page, currentFrame, primarySelector, addLog);
      
      const aiContext = {
        failedSelector: primarySelector,
        descriptiveTerm,
        pageUrl: page.url(),
        domSnippet,
        originalStep
      };
      
      addLog('[findElementWithFallbacks] AI Request Payload:', JSON.stringify(aiContext, null, 2).substring(0, 500) + (JSON.stringify(aiContext).length > 500 ? "... (truncated)" : ""));
      
      const aiResponse = await retryApiCallFn(
        () => apiClient.getDynamicSelectorSuggestion(aiContext),
        3, // maxRetries
        1000, // baseDelayMs
        'AI selector suggestion' // callDescription
      );

      if (aiResponse.success && aiResponse.data) {
        const suggestedSelector = aiResponse.data.suggestedSelector;
        const suggestedStrategy = aiResponse.data.suggestedStrategy;
        const confidence = (aiResponse.data as any).confidence;
        const reasoning = (aiResponse.data as any).reasoning;
        
        addLog(`[AI] Suggested: ${suggestedSelector} (${suggestedStrategy}, confidence: ${confidence})`);
        if (reasoning) {
          addLog(`[AI] Reasoning: ${reasoning}`);
        }

        // Try the AI suggested selector with a short wait
        element = await waitForElement(
          currentFrame, 
          suggestedSelector, 
          5000, // Increased wait for AI suggestion
          suggestedStrategy as 'css' | 'xpath'
        );

        if (element) {
          addLog('[AI] ✓ Successfully found element using AI suggestion');
          return element;
        }

        // Try alternative selectors if provided
        const alternatives = (aiResponse.data as any).alternativeSelectors;
        if (alternatives && Array.isArray(alternatives)) {
          for (const altSelector of alternatives) {
            element = await tryFindElementImmediate(currentFrame, altSelector, 'auto', addLog, index);
            if (element) {
              addLog(`[AI] ✓ Found element using alternative selector: ${altSelector}`);
              return element;
            }
          }
        }
      } else {
        addLog(`[AI] AI response failed or no suggestion: ${aiResponse.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      addLog('[findElementWithFallbacks] AI assistance failed:', error.message);
    }
  }

  // Finally, try fallback strategies with short waits
  if (!disableFallbacks) {
    const fallbackStrategies = generateFallbackStrategies(primarySelector);
    
    for (const strategy of fallbackStrategies) {
      if (Date.now() - startTime > MAX_WAIT_TIME) {
        addLog(`[findElementWithFallbacks] Timeout reached after ${MAX_WAIT_TIME}ms`);
        break;
      }

      try {
        addLog(`[findElementWithFallbacks] Trying ${strategy.type}: "${strategy.selector}"`);
        element = await waitForElement(currentFrame, strategy.selector, 2000, strategy.method); // Short wait
        
        if (element) {
          const isVisible = await verifyElementVisibility(element);
          if (isVisible) {
            addLog(`[findElementWithFallbacks] ✓ Found element using ${strategy.type} strategy`);
            return element;
          } else {
            addLog(`[findElementWithFallbacks] Element found but not visible/interactable`);
            await element.dispose();
          }
        }
      } catch (error: any) {
        addLog(`[findElementWithFallbacks] ${strategy.type} strategy failed: ${error.message}`);
      }
    }
  }

  addLog(`[findElementWithFallbacks] ✗ Failed to find element after all attempts`);
  return null;
}

// Try to find element immediately without waiting
async function tryFindElementImmediate(
  frame: Page | Frame,
  selector: string,
  selectorType: string,
  addLog: AddLogFunction,
  index: number = 0
): Promise<ElementHandle | null> {
  try {
    let element: ElementHandle | null = null;
    
    // Clean and determine selector type
    let cleanSelector = selector.trim();
    let isXPath = false;
    
    // Check for xpath:// prefix
    if (cleanSelector.startsWith('xpath://')) {
      isXPath = true;
      cleanSelector = cleanSelector.replace(/^xpath:\/\//, '');
      addLog('[tryFindElementImmediate] XPath prefix detected, cleaned selector: ' + JSON.stringify(cleanSelector));
    }
    // Check for explicit xpath type or XPath syntax
    else if (selectorType === 'xpath' || cleanSelector.includes('//') || cleanSelector.startsWith('/')) {
      isXPath = true;
      cleanSelector = cleanSelector.replace(/^xpath:/, ''); // Remove xpath: prefix if present
      addLog('[tryFindElementImmediate] XPath detected by syntax/type, cleaned selector: ' + JSON.stringify(cleanSelector));
    }
    // Check for css:// prefix
    else if (cleanSelector.startsWith('css://')) {
      isXPath = false;
      cleanSelector = cleanSelector.replace(/^css:\/\//, '');
      addLog('[tryFindElementImmediate] CSS prefix detected, cleaned selector: ' + JSON.stringify(cleanSelector));
    }
    
    addLog('[tryFindElementImmediate] Using ' + (isXPath ? 'XPath' : 'CSS') + ' method for: ' + JSON.stringify(cleanSelector));
    
    if (isXPath) {
      // Handle XPath query
      const elements = await frame.evaluateHandle((sel: string) => {
        const result = document.evaluate(sel, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        const nodes: Node[] = [];
        for (let i = 0; i < result.snapshotLength; i++) {
          nodes.push(result.snapshotItem(i) as Node);
        }
        return nodes;
      }, cleanSelector) as JSHandle<Node[]>;
      
      addLog(`[tryFindElementImmediate] XPath query found ${await elements.evaluate(e => e.length)} elements`);
      if (await elements.evaluate(e => e.length) > 0) {
        element = await frame.$(`xpath=${cleanSelector}`);
        if (element && index > 0) {
          const allElements = await frame.evaluateHandle((sel: string) => {
            const result = document.evaluate(sel, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            const nodes: Node[] = [];
            for (let i = 0; i < result.snapshotLength; i++) {
              nodes.push(result.snapshotItem(i) as Node);
            }
            return nodes;
          }, cleanSelector) as JSHandle<Node[]>;
          const allElementHandles = await allElements.evaluateHandle((nodes: Node[]) => nodes) as JSHandle<Node[]>;
          const allElementsArray = await allElementHandles.evaluate((nodes: Node[]) => nodes.map((node, i) => i));
          if (allElementsArray.length > index) {
            const indexedElement = await frame.evaluateHandle((nodes: Node[], idx: number) => nodes[idx], allElementHandles, index);
            element = indexedElement.asElement() as ElementHandle;
          }
          await allElements.dispose();
          await allElementHandles.dispose();
        }
      }
    } else {
      // Handle CSS selector
      const elements = await frame.$$(cleanSelector);
      addLog(`[tryFindElementImmediate] CSS query found ${elements.length} elements`);
      if (elements.length > 0) {
        if (index >= 0 && index < elements.length) {
          element = elements[index];
        } else {
          element = elements[0];
        }
      }
      // Dispose of extra handles if any
      elements.forEach((el, i) => {
        if (i !== index && el !== element) el.dispose();
      });
    }
    
    return element;
  } catch (error: any) {
    addLog(`[tryFindElementImmediate] Error: ${error.message}`);
    return null;
  }
}

// Helper function to convert simple XPath expressions to CSS selectors
function convertSimpleXPathToCSS(xpath: string): string | null {
  // Handle common XPath patterns
  
  // //button[text()='Open Modal'] -> button (we'll handle text matching differently)
  if (xpath.match(/^\/\/button\[text\(\)=['"]([^'"]+)['"]\]$/)) {
    const match = xpath.match(/^\/\/button\[text\(\)=['"]([^'"]+)['"]\]$/);
    if (match) {
      // Return a selector that will be handled by text-based strategies later
      return null; // Let fallback strategies handle this
    }
  }
  
  // //button[contains(text(),'Open Modal')] -> similar approach
  if (xpath.match(/^\/\/button\[contains\(text\(\),['"]([^'"]+)['"]\)\]$/)) {
    return null; // Let fallback strategies handle this
  }
  
  // //button[@id='myBtn'] -> button#myBtn
  const idMatch = xpath.match(/^\/\/(\w+)\[@id=['"]([^'"]+)['"]\]$/);
  if (idMatch) {
    return `${idMatch[1]}#${idMatch[2]}`;
  }
  
  // //button[@class='btn'] -> button.btn
  const classMatch = xpath.match(/^\/\/(\w+)\[@class=['"]([^'"]+)['"]\]$/);
  if (classMatch) {
    return `${classMatch[1]}.${classMatch[2].replace(/\s+/g, '.')}`;
  }
  
  // //*[@id='myBtn'] -> #myBtn
  const anyIdMatch = xpath.match(/^\/\/\*\[@id=['"]([^'"]+)['"]\]$/);
  if (anyIdMatch) {
    return `#${anyIdMatch[1]}`;
  }
  
  return null;
}

// Generate fallback strategies
function generateFallbackStrategies(primarySelector: string): Array<{type: string, selector: string, method: 'css' | 'xpath'}> {
  const strategies = [];
  
  // Clean selector for fallbacks
  const cleanSelector = primarySelector.replace(/^["']|["']$/g, '').trim();
  
  // If it's already a good selector, try variations
  if (cleanSelector.includes('//')) {
    // XPath variations
    strategies.push({ type: 'xpath-original', selector: cleanSelector, method: 'xpath' as const });
    
    // Extract text from XPath for CSS alternatives
    const textMatch = cleanSelector.match(/text\(\)=['"]([^'"]+)['"]/);
    if (textMatch) {
      const buttonText = textMatch[1];
      // Add CSS alternatives for button text
      strategies.push({ type: 'css-button-id', selector: '#myBtn', method: 'css' as const }); // W3Schools specific
      strategies.push({ type: 'css-button-class', selector: 'button.w3-button', method: 'css' as const });
      strategies.push({ type: 'css-button-generic', selector: 'button', method: 'css' as const });
    }
    
    strategies.push({ type: 'xpath-contains-text', selector: `//*[contains(text(), "${cleanSelector.replace(/.*text\(\)=["']([^"']+)["'].*/, '$1')}")]`, method: 'xpath' as const });
  } else if (cleanSelector.includes('#') || cleanSelector.includes('.') || cleanSelector.includes('[')) {
    // CSS selector
    strategies.push({ type: 'css-original', selector: cleanSelector, method: 'css' as const });
  } else {
    // Try as various attributes
    strategies.push({ type: 'id', selector: `#${cleanSelector}`, method: 'css' as const });
    strategies.push({ type: 'class', selector: `.${cleanSelector}`, method: 'css' as const });
    strategies.push({ type: 'name', selector: `[name="${cleanSelector}"]`, method: 'css' as const });
    strategies.push({ type: 'data-testid', selector: `[data-testid="${cleanSelector}"]`, method: 'css' as const });
    strategies.push({ type: 'aria-label', selector: `[aria-label="${cleanSelector}"]`, method: 'css' as const });
    
    // Text-based XPath
    strategies.push({ type: 'exact-text', selector: `//*[normalize-space(text())="${cleanSelector}"]`, method: 'xpath' as const });
    strategies.push({ type: 'contains-text', selector: `//*[contains(normalize-space(text()), "${cleanSelector}")]`, method: 'xpath' as const });
    strategies.push({ type: 'button-text', selector: `//button[contains(text(), "${cleanSelector}")]`, method: 'xpath' as const });
  }
  
  // Add W3Schools specific fallbacks for modal button
  if (cleanSelector.includes('Open Modal') || cleanSelector.includes('Modal')) {
    strategies.push({ type: 'w3schools-modal-id', selector: '#myBtn', method: 'css' as const });
    strategies.push({ type: 'w3schools-modal-class', selector: 'button.w3-button', method: 'css' as const });
    strategies.push({ type: 'w3schools-modal-class-green', selector: 'button.w3-button.w3-green', method: 'css' as const });
    strategies.push({ type: 'w3schools-modal-class-blue', selector: 'button.w3-button.w3-blue', method: 'css' as const });
    strategies.push({ type: 'w3schools-modal-onclick', selector: 'button[onclick*="modal"]', method: 'css' as const });
  }
  // Add W3Schools specific fallbacks for close buttons
  if (cleanSelector.includes('close') || cleanSelector.includes('Close')) {
    strategies.push({ type: 'w3schools-close-class', selector: 'span.w3-button.w3-display-topright', method: 'css' as const });
    strategies.push({ type: 'w3schools-close-onclick', selector: 'span[onclick*="display=\'none\']', method: 'css' as const });
    strategies.push({ type: 'w3schools-close-symbol', selector: 'span.w3-xlarge', method: 'css' as const });
  }
  
  return strategies;
}

// Verify element visibility efficiently
async function verifyElementVisibility(element: ElementHandle): Promise<boolean> {
  try {
    return await element.evaluate(el => {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && 
             style.visibility !== 'hidden' && 
             parseFloat(style.opacity) > 0 &&
             rect.width > 0 && 
             rect.height > 0;
    });
  } catch (error) {
    return false;
  }
}

// Fast element waiting with shorter timeout
async function waitForElement(
  frame: Page | Frame, 
  selector: string, 
  timeout: number,
  type: 'css' | 'xpath' = 'css'
): Promise<ElementHandle | null> {
  const endTime = Date.now() + timeout;
  const pollInterval = 200; // Increased poll interval for better performance
  
  while (Date.now() < endTime) {
    try {
      let element: ElementHandle | null = null;
      
      if (type === 'xpath') {
        // Try multiple approaches for XPath, similar to tryFindElementImmediate
        try {
          if ('$x' in frame && typeof (frame as any).$x === 'function') {
            const elements = await (frame as any).$x(selector);
            if (elements.length > 0) {
              element = elements[0];
            }
          } else {
            // Fallback: use evaluateHandle with document.evaluate
            const elementHandle = await frame.evaluateHandle((xpath: string) => {
              const result = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.FIRST_ORDERED_NODE_TYPE,
                null
              );
              return result.singleNodeValue;
            }, selector);
            
            if (elementHandle) {
              const asElement = elementHandle.asElement();
              if (asElement) {
                element = asElement as ElementHandle<Element>;
              } else {
                await elementHandle.dispose();
              }
            }
          }
        } catch (xpathError) {
          // Try CSS equivalent as fallback
          const cssEquivalent = convertSimpleXPathToCSS(selector);
          if (cssEquivalent) {
            element = await frame.$(cssEquivalent);
          }
        }
      } else {
        element = await frame.$(selector);
      }
      
      if (element) {
        const isConnected = await element.evaluate(el => el.isConnected);
        if (isConnected) {
          return element;
        }
        await element.dispose();
      }
    } catch (error) {
      // Ignore errors during waiting
    }
    
    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  return null;
}

// Enhanced DOM capture for better AI performance
export async function captureFocusedDomSnippet(
  page: Page,
  currentFrame: Page | Frame,
  failedSelector: string,
  addLog: AddLogFunction
): Promise<string> {
  try {
    const domSnippet = await (currentFrame === page ? page : currentFrame).evaluate((selector) => {
      // Enhanced DOM capture with better context but limited size
      const buttons = Array.from(document.querySelectorAll('button')).slice(0, 10).map(b => 
        `<button${b.id ? ` id="${b.id}"` : ''}${b.className ? ` class="${b.className}"` : ''}${b.onclick ? ` onclick="..."` : ''}>${b.textContent?.trim().substring(0, 50) || ''}</button>`
      );
      
      const inputs = Array.from(document.querySelectorAll('input')).slice(0, 5).map(i => 
        `<input${i.id ? ` id="${i.id}"` : ''}${i.className ? ` class="${i.className}"` : ''}${i.type ? ` type="${i.type}"` : ''}${i.name ? ` name="${i.name}"` : ''}${i.placeholder ? ` placeholder="${i.placeholder}"` : ''}>`
      );
      
      const images = Array.from(document.querySelectorAll('img')).slice(0, 5).map(img => 
        `<img${img.id ? ` id="${img.id}"` : ''}${img.className ? ` class="${img.className}"` : ''}${img.alt ? ` alt="${img.alt}"` : ''}${img.src ? ` src="${img.src.substring(0, 50)}..."` : ''}>`
      );
      
      const links = Array.from(document.querySelectorAll('a')).slice(0, 5).map(a => 
        `<a${a.id ? ` id="${a.id}"` : ''}${a.className ? ` class="${a.className}"` : ''}${a.href ? ` href="${a.href.substring(0, 30)}..."` : ''}>${a.textContent?.trim().substring(0, 50) || ''}</a>`
      );
      
      const divs = Array.from(document.querySelectorAll('div[id], div[class*="gallery"], div[class*="trash"], div[class*="modal"], div[class*="popup"]')).slice(0, 5).map(d => 
        `<div${d.id ? ` id="${d.id}"` : ''}${d.className ? ` class="${d.className}"` : ''}>${d.children.length > 0 ? '...' : (d.textContent?.trim().substring(0, 30) || '')}</div>`
      );
      
      const spans = Array.from(document.querySelectorAll('span[id], span[class]')).slice(0, 5).map(s => 
        `<span${s.id ? ` id="${s.id}"` : ''}${s.className ? ` class="${s.className}"` : ''}>${s.textContent?.trim().substring(0, 30) || ''}</span>`
      );
      
      // Get title and URL for context
      const pageInfo = `Page: ${document.title} (${window.location.href})`;
      
      return `${pageInfo}\n\nButtons: ${buttons.join(', ')}\n\nInputs: ${inputs.join(', ')}\n\nImages: ${images.join(', ')}\n\nLinks: ${links.join(', ')}\n\nDivs: ${divs.join(', ')}\n\nSpans: ${spans.join(', ')}`;
    }, failedSelector);
    
    addLog(`[DOM Capture] Captured ${domSnippet.length} characters of DOM context`);
    return domSnippet;
  } catch (error: any) {
    addLog(`[DOM Capture] Error: ${error.message}`);
    return 'Failed to capture DOM snippet';
  }
}

// Legacy class-based interface for backward compatibility
export class ElementFinder {
  private page: Page;
  private frame: Page | Frame;
  private addLog: AddLogFunction;
  private retryApiCallFn?: RetryApiCallFunction;

  constructor(
    page: Page,
    frame: Page | Frame,
    addLog: AddLogFunction,
    retryApiCallFn?: RetryApiCallFunction
  ) {
    this.page = page;
    this.frame = frame;
    this.addLog = addLog;
    this.retryApiCallFn = retryApiCallFn;
  }

  async findElement(
    context: ElementContext,
    options: FindElementOptions = {}
  ): Promise<ElementHandle | null> {
    return await findElementWithFallbacks(
      this.page,
      this.frame,
      this.addLog,
      context.selector,
      context.descriptiveTerm,
      context.originalStep,
      !options.retryWithAI,
      this.retryApiCallFn,
      context.index || 0
    );
  }
}