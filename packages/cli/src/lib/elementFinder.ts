import { Page, Frame, ElementHandle, JSHandle } from 'puppeteer';
import { extractHintedSelector } from './parserHelpers/extractHintedSelector';
import { finalizeSelector } from './parserHelpers/finalizeSelector';
import { apiClient } from '../api/client'; // Assuming apiClient can be imported

export type AddLogFunction = (message: string, data?: any) => void;

// Fallback strategies will be attempted if the direct selector fails.
export async function findElementWithFallbacks(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  rawSelectorOrText: string,
  descriptiveTerm?: string,
  originalStep?: string, // Added for AI context
  aiAttempted: boolean = false // To prevent infinite AI loops
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
  const attempts: { strategy: string, selector: string }[] = [];

  // Build attempts based on primarySelectorType and primarySelector
  if (primarySelectorType === 'xpath') {
    attempts.push({ strategy: 'Direct XPath', selector: primarySelector });
  } else if (primarySelectorType === 'css') {
    attempts.push({ strategy: 'Direct CSS', selector: primarySelector });
  } else {
    // Fallback if no explicit type, or if it's an unknown prefixed type
    addLog(`[findElementWithFallbacks] No specific primarySelectorType or unknown type. Defaulting to broader strategies.`);
    // Original logic for when no hint was found
    if (primarySelector.startsWith('xpath:')) { // This case should ideally be caught by the prefix check now
        attempts.push({ strategy: 'Direct XPath', selector: primarySelector.substring(6) });
    } else if (primarySelector.includes(' >> ')) { // Shadow DOM
        attempts.push({ strategy: 'Shadow DOM Path', selector: primarySelector });
    } else if (primarySelector.match(/^([#.]|\[)/) || primarySelector.includes('>') || primarySelector.includes('+') || primarySelector.includes('~')) {
        attempts.push({ strategy: 'Direct CSS', selector: primarySelector });
    }
  }

  // Add text-based fallbacks, these are always good to have
  const textForXPathFallbacks = textSearchTerm.replace(/"/g, '\"');
  const termForCssFallbacks = textSearchTerm;
  
  attempts.push({
      strategy: 'Text in button/link/input (XPath)',
      selector: `xpath:.//button[contains(normalize-space(.), "${textForXPathFallbacks}")] | .//a[contains(normalize-space(.), "${textForXPathFallbacks}")] | .//input[@type='submit' and @value="${textForXPathFallbacks}"] | .//input[@type='button' and @value="${textForXPathFallbacks}"]`,
  });

  attempts.push({ strategy: 'ARIA Label (CSS)', selector: `[aria-label="${termForCssFallbacks}"]` });
  attempts.push({ strategy: 'ARIA Label contains (CSS)', selector: `[aria-label*="${termForCssFallbacks}"]` });
  attempts.push({ strategy: 'Placeholder (CSS)', selector: `input[placeholder="${termForCssFallbacks}"]` });
  attempts.push({ strategy: 'Placeholder contains (CSS)', selector: `input[placeholder*="${termForCssFallbacks}"]` });
  
  const normalizedTermForCssFallbacks = termForCssFallbacks.replace(/[^a-zA-Z0-9-_]/g, '');
  if (normalizedTermForCssFallbacks) {
      attempts.push({ strategy: 'ID (CSS)', selector: `#${normalizedTermForCssFallbacks}` });
      attempts.push({ strategy: 'Name (CSS)', selector: `[name="${normalizedTermForCssFallbacks}"]` });
      attempts.push({ strategy: 'Class (CSS)', selector: `.${normalizedTermForCssFallbacks}` });
  }

  // Ensure "Raw as CSS" is added if no CSS type was explicitly determined but it doesn't look like an XPath
  if (primarySelectorType !== 'css' && primarySelectorType !== 'xpath' && !primarySelector.includes(' >> ')) {
      if (!attempts.some(a => a.selector === primarySelector && (a.strategy === 'Direct CSS' || a.strategy === 'Raw as CSS'))) {
          attempts.push({ strategy: 'Raw as CSS', selector: primarySelector });
      }
  }
  
  const uniqueAttempts = attempts.filter((attempt, index, self) => 
      index === self.findIndex(a => a.selector === attempt.selector && a.strategy === attempt.strategy)
  );
  
  addLog(`[findElementWithFallbacks] Number of unique strategies to try: ${uniqueAttempts.length}. Raw selector was: "${rawSelectorOrText}"`);
  if (uniqueAttempts.length === 0 && primarySelector) {
    addLog(`[findElementWithFallbacks] No strategies generated, but primarySelector exists. Adding it as a 'Raw as CSS' attempt.`);
    uniqueAttempts.push({ strategy: 'Raw as CSS', selector: primarySelector });
  }

  for (const attempt of uniqueAttempts) {
    addLog(`Trying strategy: ${attempt.strategy}, Selector: ${attempt.selector}`);
    try {
      if (attempt.strategy === 'Direct XPath') {
          const presenceTimeout = timeout * 2 / 3; // 10s
          const visibilityTimeout = timeout / 3;   // 5s
          // Ensure selector for Puppeteer starts with 'xpath:' but not 'xpath:xpath:'
          const finalXPathSelector = attempt.selector.startsWith('xpath:') 
                                   ? attempt.selector 
                                   : `xpath:${attempt.selector}`;
          addLog(`Trying strategy: ${attempt.strategy}, Puppeteer Selector: ${finalXPathSelector}`);
          element = await executionContext.waitForSelector(finalXPathSelector, { timeout: presenceTimeout }); 
          if (element) {
              addLog(`Direct XPath: Element found in DOM. Now checking for visibility (timeout: ${visibilityTimeout}ms)`);
              try {
                await executionContext.waitForSelector(finalXPathSelector, { visible: true, timeout: visibilityTimeout });
                addLog('Direct XPath: Element is present AND confirmed visible.');
              } catch (visibilityError) {
                addLog(`Direct XPath: Element found in DOM but NOT VISIBLE within ${visibilityTimeout}ms. Error: ${(visibilityError as Error).message.split('\n')[0]}. Proceeding with the handle, interaction might fail.`);
              }
               return element; 
          } else {
              addLog(`Direct XPath: Element not even found in DOM with initial check (no visibility constraint) within ${presenceTimeout}ms.`);
          }
      } else if (attempt.strategy === 'Direct CSS') {
          const presenceTimeout = timeout * 2 / 3; // 10s
          const visibilityTimeout = timeout / 3;   // 5s
          // Ensure selector for Puppeteer does not start with 'css:' if it was already clean
          const finalCssSelector = attempt.selector.startsWith('css:') && !attempt.selector.startsWith('css:css:')
                                 ? attempt.selector.substring(4) 
                                 : attempt.selector;
          addLog(`Trying strategy: ${attempt.strategy}, Puppeteer Selector: ${finalCssSelector}`);
          element = await executionContext.waitForSelector(finalCssSelector, { timeout: presenceTimeout });
          if (element) {
              addLog(`Direct CSS: Element found in DOM. Now checking for visibility (timeout: ${visibilityTimeout}ms)`);
              try {
                  await executionContext.waitForSelector(finalCssSelector, { visible: true, timeout: visibilityTimeout });
                  addLog('Direct CSS: Element is present AND confirmed visible.');
              } catch (visibilityError) {
                  addLog(`Direct CSS: Element found in DOM but NOT VISIBLE within ${visibilityTimeout}ms. Error: ${(visibilityError as Error).message.split('\n')[0]}. Proceeding with the handle, interaction might fail.`);
              }
              return element; 
          } else {
              addLog(`Direct CSS: Element not found in DOM within ${presenceTimeout}ms.`);
          }
      } else if (attempt.strategy === 'Shadow DOM Path') {
        const parts = attempt.selector.split(' >> ');
        const hostSelector = parts[0];
        const innerSelector = parts.slice(1).join(' >> ');

        if (!hostSelector || !innerSelector) {
          addLog('Malformed Shadow DOM selector, skipping.');
          continue;
        }

        addLog(`Shadow DOM: Locating host "${hostSelector}"`);
        let hostElement: ElementHandle | null = null;
        try {
          hostElement = await executionContext.waitForSelector(hostSelector, { visible: true, timeout: timeout / 2 }); 
        } catch (hostError) {
          addLog(`Shadow DOM: Host element "${hostSelector}" not found. Error: ${(hostError as Error).message.split('\n')[0]}`);
          continue; 
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
          } else {
            addLog(`Shadow DOM: Inner element "${innerSelector}" not found as an Element in host "${hostSelector}".`);
            await foundInShadowJSHandle.dispose(); 
            if (hostElement) await hostElement.dispose();
            continue; 
          }

          if (hostElement && element !== hostElement) { 
              await hostElement.dispose();
          }
        } else {
          addLog(`Shadow DOM: Host "${hostSelector}" could not be resolved.`);
          continue;
        }
      } else {
        element = await executionContext.waitForSelector(attempt.selector, { visible: true, timeout });
      }

      if (element) {
        addLog(`Element found with strategy: ${attempt.strategy}`);
        try {
          const isVisible = await element.isIntersectingViewport();
          if (isVisible) {
             addLog('Element is visible and intersecting viewport.');
             return element; 
          }
          addLog('Element found but not visible in viewport, trying next strategy.');
        } catch (intersectError) {
          // If isIntersectingViewport itself errors (e.g., times out like in the logs)
          addLog(`Warning: Checking isIntersectingViewport for strategy ${attempt.strategy} (selector: "${attempt.selector}") failed: ${(intersectError as Error).message.split('\n')[0]}. Proceeding with element found by prior visibility check.`);
          return element; // Return the element found by waitForSelector({visible:true}) or shadow DOM query
        }
        // If isVisible was false (and no error during check)
        await element.dispose(); 
        element = null;
      } else {
          addLog(`Strategy ${attempt.strategy} with selector ${attempt.selector} did not yield an element.`);
      }
    } catch (error) {
      if (!(attempt.strategy === 'Shadow DOM Path' && (error as Error).message.includes('Host element'))) {
          addLog(`Strategy ${attempt.strategy} failed: ${(error as Error).message.split('\n')[0]}`);
      }
    }
  }

  // If element is still not found after all strategies, log the page content.
  if (!element && !aiAttempted && originalStep) { // Only attempt AI if originalStep is provided and not already an AI attempt
    addLog(`[findElementWithFallbacks] Element not found with standard strategies. Attempting AI suggestion...`);
    try {
      // const currentDomSnapshot = await executionContext.evaluate(() => document.body.outerHTML).catch(() => 'DOM snapshot unavailable');
      
      // // Prepare context for the AI. This might need to be more structured.
      // const aiContext = {
      //   failedSelector: rawSelectorOrText,
      //   descriptiveTerm: effectiveDescriptiveTerm,
      //   pageUrl: page.url(),
      //   domSnippet: currentDomSnapshot.substring(0, 5000), // Send a snippet to avoid huge payloads
      //   originalStep: originalStep,
      //   // You might add more context like previous successful steps, or error messages from failed attempts
      // };

      // addLog('[findElementWithFallbacks] Calling AI for selector suggestion with context:', aiContext);
      // // This is a hypothetical endpoint. You'll need to define its actual signature and response structure.
      // const aiResponse = await apiClient.getDynamicSelectorSuggestion(aiContext); 

      // if (aiResponse && aiResponse.success && aiResponse.data && aiResponse.data.suggestedSelector) {
      //   const { suggestedSelector, suggestedStrategy } = aiResponse.data;
      //   addLog(`[findElementWithFallbacks] AI suggested new selector: "${suggestedSelector}" (Strategy: ${suggestedStrategy || 'default behavior'})`);
        
      //   // Re-attempt findElementWithFallbacks with the AI's suggestion.
      //   // Pass a flag to prevent further AI attempts in this recursive call.
      //   // The suggestedStrategy would need to be handled, perhaps by prefixing suggestedSelector (e.g., "css:...", "xpath:...")
      //   // For simplicity, assuming suggestedSelector is ready to be used or is prefixed by the AI.
      //   // If suggestedStrategy is important, the logic here would need to adapt.
      //   let selectorForRetry = suggestedSelector;
      //   if (suggestedStrategy && !suggestedSelector.startsWith(suggestedStrategy + ':')) {
      //       selectorForRetry = `${suggestedStrategy}:${suggestedSelector}`;
      //   }


      //   return findElementWithFallbacks(page, currentFrame, addLog, selectorForRetry, `AI-suggested: ${descriptiveTerm || rawSelectorOrText}`, originalStep, true);
      // } else {
      //   addLog('[findElementWithFallbacks] AI did not provide a usable suggestion or AI call failed.');
      //   if (aiResponse && aiResponse.error) {
      //       addLog(`[findElementWithFallbacks] AI Error: ${aiResponse.error}`);
      //   }
      // }
      addLog('[findElementWithFallbacks] AI suggestion block is temporarily commented out pending backend API implementation.');
    } catch (aiError: any) {
      addLog(`[findElementWithFallbacks] Error during AI suggestion attempt (block is commented out): ${aiError.message}`);
    }
  } else if (element) { // Element was found by standard strategies
      return element;
  }

  // If element still not found (either standard attempt failed and AI didn't help, or AI was not attempted)
  if (!element) {
    addLog(`[findElementWithFallbacks] Element still not found after all strategies (and potential AI attempt). Dumping current frame content...`);
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