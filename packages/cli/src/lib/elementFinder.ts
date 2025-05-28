import { Page, Frame, ElementHandle, JSHandle } from 'puppeteer';
import { extractHintedSelector } from './parserHelpers/extractHintedSelector';
import { finalizeSelector } from './parserHelpers/finalizeSelector';
import { apiClient, ApiResponse } from '../api/client'; // Assuming apiClient can be imported

export type AddLogFunction = (message: string, data?: any) => void;
export type RetryApiCallFunction = <T>(
  apiCall: () => Promise<ApiResponse<T>>,
  maxRetries: number,
  baseDelayMs: number,
  callDescription: string
) => Promise<ApiResponse<T>>;

// Fallback strategies will be attempted if the direct selector fails.
export async function findElementWithFallbacks(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  rawSelectorOrText: string,
  descriptiveTerm?: string,
  originalStep?: string, // Added for AI context
  aiAttempted: boolean = false, // To prevent infinite AI loops
  retryApiCallFn?: RetryApiCallFunction // Added for retrying AI calls
): Promise<ElementHandle> {
  if (!page || !currentFrame) throw new Error('Page or currentFrame not available for finding element');

  let effectiveDescriptiveTerm: string = descriptiveTerm || rawSelectorOrText;
  let primarySelector: string = rawSelectorOrText;
  let primarySelectorType: string | undefined;

  addLog(`[findElementWithFallbacks] Initial rawSelectorOrText: "${rawSelectorOrText}"`);

  const hintResult = extractHintedSelector(rawSelectorOrText);
  
  let textSearchTerm = rawSelectorOrText; // Default to raw for text-based fallbacks

  if (hintResult.selectorValue && typeof hintResult.type === 'string') {
    primarySelector = finalizeSelector(hintResult.type, hintResult.selectorValue) as string;
    primarySelectorType = hintResult.type.toLowerCase();
    addLog(`[findElementWithFallbacks] Hint (type:value) extracted. Type: "${primarySelectorType}", Cleaned Selector: "${primarySelector}"`);
    
    if (descriptiveTerm) {
        effectiveDescriptiveTerm = descriptiveTerm;
    } else if (hintResult.remainingStep && hintResult.remainingStep.trim() !== '') {
        effectiveDescriptiveTerm = hintResult.remainingStep;
    } else {
        effectiveDescriptiveTerm = hintResult.selectorValue || rawSelectorOrText;
    }

    if (hintResult.remainingStep && hintResult.remainingStep.trim() !== '') {
        textSearchTerm = hintResult.remainingStep; 
        addLog(`[findElementWithFallbacks] Using hintResult.remainingStep ("${hintResult.remainingStep}") for text-based fallbacks.`);
    } else {
        textSearchTerm = hintResult.selectorValue; 
        addLog(`[findElementWithFallbacks] Using hintResult.selectorValue ("${hintResult.selectorValue}") for text-based fallbacks as remainingStep was empty/absent.`);
    }

  } else {
    addLog(`[findElementWithFallbacks] No valid hint (type:value) extracted from rawSelectorOrText. Checking for direct prefixes.`);
    effectiveDescriptiveTerm = descriptiveTerm || rawSelectorOrText; 
    
    if (rawSelectorOrText.toLowerCase().startsWith('xpath:')) {
      primarySelectorType = 'xpath';
      primarySelector = rawSelectorOrText.substring(6);
      textSearchTerm = primarySelector; // Set textSearchTerm to the selector part
      addLog(`[findElementWithFallbacks] Direct XPath prefix found. Type: "${primarySelectorType}", Selector: "${primarySelector}", TextSearchTerm: "${textSearchTerm}"`);
    } else if (rawSelectorOrText.toLowerCase().startsWith('css:')) {
      primarySelectorType = 'css';
      primarySelector = rawSelectorOrText.substring(4);
      textSearchTerm = primarySelector; // Set textSearchTerm to the selector part
      addLog(`[findElementWithFallbacks] Direct CSS prefix found. Type: "${primarySelectorType}", Selector: "${primarySelector}", TextSearchTerm: "${textSearchTerm}"`);
    } else {
      addLog(`[findElementWithFallbacks] No hint found in rawSelectorOrText. Proceeding with raw value for strategies.`);
      // textSearchTerm remains rawSelectorOrText (which has no hint and no prefix)
    }
  }
  
  let loggablePrimarySelector = primarySelector;
  try {
      loggablePrimarySelector = JSON.stringify(primarySelector);
  } catch (e) { 
      addLog(`Warning: Could not JSON.stringify primarySelector for logging: ${(e as Error).message}`);
  }
  addLog(`Attempting to find element. Primary Selector (logged as JSON string): ${loggablePrimarySelector}, Type: ${primarySelectorType || 'unknown'}, Descriptive: "${effectiveDescriptiveTerm}"`);

  const executionContext = currentFrame;
  const timeout = 15000; // Overall timeout for finding element with one strategy
  let element: ElementHandle | null = null;

  // Simplified initial attempt logic
  let attemptSelector = primarySelector;
  let attemptStrategy = 'Direct'; // Generic strategy name

  if (primarySelectorType === 'xpath') {
    attemptStrategy = 'Direct XPath';
    attemptSelector = primarySelector.startsWith('xpath:') ? primarySelector : `xpath:${primarySelector}`;
  } else if (primarySelectorType === 'css') {
    attemptStrategy = 'Direct CSS';
    attemptSelector = primarySelector.startsWith('css:') ? primarySelector.substring(4) : primarySelector;
  } else if (primarySelector.includes(' >> ')) {
    attemptStrategy = 'Shadow DOM Path';
    // Selector remains as is for shadow DOM
  } else if (primarySelector.match(/^([#.]|\[)/) || primarySelector.includes('>') || primarySelector.includes('+') || primarySelector.includes('~') || (!primarySelector.includes('/') && !primarySelector.includes('(') && !primarySelector.includes(')'))) {
     // Basic check if it might be a CSS selector if no other type is identified
    attemptStrategy = 'Assumed CSS';
    attemptSelector = primarySelector; // Use raw selector
  } else {
    // If no clear type, and not obviously CSS, default to trying it as XPath as a last resort for direct types
    attemptStrategy = 'Assumed XPath';
    attemptSelector = primarySelector.startsWith('xpath:') ? primarySelector : `xpath:${primarySelector}`;
    addLog(`[findElementWithFallbacks] No specific selector type, assuming XPath for: "${primarySelector}"`);
  }
  
  addLog(`[findElementWithFallbacks] Initial attempt strategy: ${attemptStrategy}, Selector: "${attemptSelector}"`);

  try {
    if (attemptStrategy === 'Direct XPath' || attemptStrategy === 'Assumed XPath') {
        const presenceTimeout = timeout * 2 / 3; 
        const visibilityTimeout = timeout / 3;  
        addLog(`Trying strategy: ${attemptStrategy}, Puppeteer Selector: ${attemptSelector}`);
        element = await executionContext.waitForSelector(attemptSelector, { timeout: presenceTimeout }); 
        if (element) {
            addLog(`${attemptStrategy}: Element found in DOM. Checking visibility (timeout: ${visibilityTimeout}ms)`);
            try {
              await executionContext.waitForSelector(attemptSelector, { visible: true, timeout: visibilityTimeout });
              addLog(`${attemptStrategy}: Element is present AND confirmed visible.`);
            } catch (visibilityError) {
              addLog(`${attemptStrategy}: Element found in DOM but NOT VISIBLE within ${visibilityTimeout}ms. Error: ${(visibilityError as Error).message.split('\n')[0]}. Proceeding.`);
            }
             return element; 
        } else {
            addLog(`${attemptStrategy}: Element not found in DOM (presence timeout: ${presenceTimeout}ms).`);
        }
    } else if (attemptStrategy === 'Direct CSS' || attemptStrategy === 'Assumed CSS') {
        const presenceTimeout = timeout * 2 / 3; 
        const visibilityTimeout = timeout / 3;  
        addLog(`Trying strategy: ${attemptStrategy}, Puppeteer Selector: ${attemptSelector}`);
        element = await executionContext.waitForSelector(attemptSelector, { timeout: presenceTimeout });
        if (element) {
            addLog(`${attemptStrategy}: Element found in DOM. Checking visibility (timeout: ${visibilityTimeout}ms)`);
            try {
                await executionContext.waitForSelector(attemptSelector, { visible: true, timeout: visibilityTimeout });
                addLog(`${attemptStrategy}: Element is present AND confirmed visible.`);
            } catch (visibilityError) {
                addLog(`${attemptStrategy}: Element found in DOM but NOT VISIBLE within ${visibilityTimeout}ms. Error: ${(visibilityError as Error).message.split('\n')[0]}. Proceeding.`);
            }
            return element; 
        } else {
            addLog(`${attemptStrategy}: Element not found in DOM (presence timeout: ${presenceTimeout}ms).`);
        }
    } else if (attemptStrategy === 'Shadow DOM Path') {
      const parts = attemptSelector.split(' >> ');
      const hostSelector = parts[0];
      const innerSelector = parts.slice(1).join(' >> ');

      if (!hostSelector || !innerSelector) {
        addLog('Malformed Shadow DOM selector, skipping initial attempt.');
      } else {
        addLog(`Shadow DOM: Locating host "${hostSelector}"`);
        let hostElement: ElementHandle | null = null;
        try {
          hostElement = await executionContext.waitForSelector(hostSelector, { visible: true, timeout: timeout / 2 }); 
        } catch (hostError) {
          addLog(`Shadow DOM: Host element "${hostSelector}" not found. Error: ${(hostError as Error).message.split('\n')[0]}`);
        }

        if (hostElement) {
          addLog(`Shadow DOM: Host "${hostSelector}" found. Querying for "${innerSelector}" in its shadow root.`);
          const foundInShadowJSHandle: JSHandle<Element | null> = await hostElement.evaluateHandle((host, sel) => {
            if (host.shadowRoot) {
              const el = host.shadowRoot.querySelector(sel);
              if (el instanceof Element) {
                return el;
              }
            }
            return null;
          }, innerSelector);

          const tempElementHandle = foundInShadowJSHandle.asElement();

          if (tempElementHandle) {
            element = tempElementHandle as ElementHandle<Element>; 
            addLog('Shadow DOM: Element found and confirmed visible (implicit from querySelector).');
          } else {
            addLog(`Shadow DOM: Inner element "${innerSelector}" not found as an Element in host "${hostSelector}".`);
            await foundInShadowJSHandle.dispose();
          }
          if (hostElement && element !== hostElement) { 
              await hostElement.dispose();
          }
          if (element) return element;
        } else {
          addLog(`Shadow DOM: Host "${hostSelector}" could not be resolved.`);
        }
      }
    }
    // If element is found and visible by any initial strategy, it's returned above.
    // If we reach here, the initial attempt(s) failed or element wasn't visible.
  } catch (error) {
    addLog(`Initial attempt with strategy ${attemptStrategy} for selector "${attemptSelector}" failed: ${(error as Error).message.split('\n')[0]}`);
  }
  
  // If element is still not found after initial optimized strategies, try AI.
  // The aiAttempted flag prevents infinite loops if AI also fails.
  // originalStep is crucial for AI context.
  if (!element && !aiAttempted && originalStep) { 
    addLog(`[findElementWithFallbacks] Initial selector "${rawSelectorOrText}" failed. Attempting AI suggestion...`);
    try {
      const currentDomSnapshot = await executionContext.evaluate(() => {
        // Limit DOM snapshot complexity and size
        const MAX_ELEMENTS = 100;
        const MAX_ATTR_LENGTH = 50;
        const MAX_TEXT_LENGTH = 80;

        function truncate(str: string, len: number) {
            return str.length > len ? str.substring(0, len - 3) + "..." : str;
        }

        let count = 0;
        function elementToString(el: Element): string {
            if (count >= MAX_ELEMENTS) return '';
            count++;
            const tagName = el.tagName.toLowerCase();
            let attrs = '';
            for (let i = 0; i < el.attributes.length; i++) {
                const attr = el.attributes[i];
                if (attr.name === 'style' || attr.name.startsWith('on')) continue; // Skip style and event handlers
                attrs += ` ${attr.name}="${truncate(attr.value, MAX_ATTR_LENGTH)}"`;
            }
            let children = '';
            if (el.children.length > 0) {
                for (let i = 0; i < el.children.length; i++) {
                    children += elementToString(el.children[i] as Element);
                    if (count >= MAX_ELEMENTS) break;
                }
            }
            let text = '';
            if (el.childNodes.length > 0) {
                for (let i = 0; i < el.childNodes.length; i++) {
                    const childNode = el.childNodes[i];
                    if (childNode.nodeType === Node.TEXT_NODE && childNode.textContent?.trim()) {
                        text += truncate(childNode.textContent.trim(), MAX_TEXT_LENGTH);
                        break; // Take first significant text node
                    }
                }
            }
            return `<${tagName}${attrs}>${text}${children}</${tagName}>`;
        }
        // Try to get a more focused part of the DOM if possible, e.g., main content area
        const mainContent = document.querySelector('main') || document.body;
        return elementToString(mainContent);
      }).catch(() => 'DOM snapshot unavailable');
      
      const aiContext = {
        failedSelector: rawSelectorOrText,
        descriptiveTerm: effectiveDescriptiveTerm,
        pageUrl: page.url(),
        // Limit DOM snippet length again, just in case elementToString produced something huge
        domSnippet: currentDomSnapshot.substring(0, 8000), 
        originalStep: originalStep,
        // TODO: Consider adding viewport dimensions, or info about focused element if any
      };

      addLog('[findElementWithFallbacks] Calling AI for selector suggestion. Context length (DOM snippet): ' + aiContext.domSnippet.length);
      
      let aiResponse: ApiResponse<{ suggestedSelector: string; suggestedStrategy?: string; }> | undefined;

      if (retryApiCallFn) {
        aiResponse = await retryApiCallFn(
          () => apiClient.getDynamicSelectorSuggestion(aiContext),
          3, // maxRetries
          1000, // baseDelayMs
          'getDynamicSelectorSuggestion'
        );
      } else {
        // Fallback if retryApiCallFn is not provided (e.g. direct tests not via LocalBrowserExecutor)
        addLog('[findElementWithFallbacks] Warning: retryApiCallFn not provided. Calling AI directly.');
        aiResponse = await apiClient.getDynamicSelectorSuggestion(aiContext);
      }

      if (aiResponse && aiResponse.success && aiResponse.data && aiResponse.data.suggestedSelector) {
        const { suggestedSelector, suggestedStrategy } = aiResponse.data;
        addLog(`[findElementWithFallbacks] AI suggested new selector: "${suggestedSelector}" (Strategy: ${suggestedStrategy || 'default behavior'})`);
        
        let selectorForRetry = suggestedSelector;
        // Ensure the AI suggested selector is prefixed correctly if a strategy is given
        if (suggestedStrategy && (suggestedStrategy.toLowerCase() === 'xpath' || suggestedStrategy.toLowerCase() === 'css')) {
            if (!selectorForRetry.toLowerCase().startsWith(suggestedStrategy.toLowerCase() + ':')) {
                 selectorForRetry = `${suggestedStrategy.toLowerCase()}:${selectorForRetry}`;
            }
        } else if (suggestedStrategy) {
            addLog(`[findElementWithFallbacks] AI suggested unknown strategy: "${suggestedStrategy}". Will attempt selector as is, then with common prefixes.`);
            // If AI provides a strategy not css/xpath, we might try it directly or prepend css/xpath if it fails.
            // For now, we'll pass it to the recursive call, which will try to infer type.
        }
        
        // Re-attempt findElementWithFallbacks with the AI's suggestion.
        return findElementWithFallbacks(page, currentFrame, addLog, selectorForRetry, `AI-suggested: ${descriptiveTerm || rawSelectorOrText}`, originalStep, true, retryApiCallFn);
      } else {
        addLog('[findElementWithFallbacks] AI did not provide a usable suggestion or AI call failed.');
        if (aiResponse && aiResponse.error) {
            addLog(`[findElementWithFallbacks] AI Error: ${aiResponse.error}`);
        }
      }
    } catch (aiError: any) {
      addLog(`[findElementWithFallbacks] Error during AI suggestion attempt: ${aiError.message}`);
    }
  } else if (element) { // Element was found by an initial strategy
      // Visibility should have been checked by the strategy that found it.
      return element;
  }

  // If element still not found (either initial attempt failed and AI didn't help/wasn't attempted, or AI attempt also failed)
  if (!element) {
    addLog(`[findElementWithFallbacks] Element still not found for "${rawSelectorOrText}" (descriptive: "${effectiveDescriptiveTerm}") after all attempts including AI. Dumping current frame content...`);
    try {
      const frameContent = await executionContext.evaluate(() => document.body.outerHTML);
      addLog(`[findElementWithFallbacks] Current frame body outerHTML: ${frameContent}`);
    } catch (dumpError) {
      addLog(`[findElementWithFallbacks] Failed to dump frame content: ${(dumpError as Error).message}`);
      // Try to get main page content if frame dump fails
      if (page) {
        try {
          const pageContent = await page.content();
          addLog(`[findElementWithFallbacks] Main page content: ${pageContent}`);
        } catch (pageDumpError) {
          addLog(`[findElementWithFallbacks] Failed to dump main page content: ${(pageDumpError as Error).message}`);
        }
      }
    }
  }

  throw new Error(`Element not found for "${rawSelectorOrText}" (descriptive: "${effectiveDescriptiveTerm}") after all fallback strategies.`);
} 