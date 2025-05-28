import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction } from '../elementFinder'; // Adjust path as necessary

export async function handleSwitchToIframe(
  page: Page | null,
  addLog: AddLogFunction,
  selector?: string
): Promise<Frame | null> { // Return the new frame context
  if (!page) throw new Error('Page not available for switching to iframe');
  if (!selector) throw new Error('Iframe selector not provided for switching');
  addLog(`Attempting to switch to iframe. Target selector hint: "${selector}"`);

  let iframeElementHandler: ElementHandle<HTMLIFrameElement> | null = null;
  let newFrame: Frame | null = null;

  try {
    addLog('Stage 1: Waiting for ANY iframe tag to appear in the DOM (max 10s)...');
    try {
        await page.waitForSelector('iframe', { timeout: 10000 });
        addLog('Stage 1: At least one iframe tag is present in the DOM.');
    } catch (e: any) {
        addLog(`Stage 1: No iframe tags found in the DOM. Error: ${e.message}`);
        throw new Error(`No iframe tags found on the page. Error: ${e.message}`);
    }
    
    addLog(`Stage 2: Waiting for an iframe to match criteria (e.g., XPath or CSS selector) (max 15s)...`);
    const pureSelector = selector.startsWith('xpath:') ? selector.substring(6) : selector;

    if (selector.startsWith('xpath:')) {
        addLog(`[handleSwitchToIframe] Using pure XPath for waitForFunction: "${pureSelector}"`);
        const targetIframeHandle = await page.waitForFunction(
            (xpathExpression) => {
                const iterator = document.evaluate(xpathExpression, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
                const element = iterator.singleNodeValue;
                return element as HTMLIFrameElement | null; 
            },
            { timeout: 15000 }, 
            pureSelector
        );
        if (!targetIframeHandle || !targetIframeHandle.asElement()) {
             throw new Error('waitForFunction (XPath) did not return a valid ElementHandle for the iframe.');
        }
        iframeElementHandler = targetIframeHandle.asElement() as ElementHandle<HTMLIFrameElement>;
    } else {
        addLog(`[handleSwitchToIframe] Using CSS selector for waitForSelector: "${pureSelector}"`);
        iframeElementHandler = await page.waitForSelector(pureSelector, { timeout: 15000 }) as ElementHandle<HTMLIFrameElement>;
        if (!iframeElementHandler) {
            throw new Error('waitForSelector (CSS) did not return a valid ElementHandle for the iframe.');
        }
    }
    addLog(`Stage 2: Specific iframe found using selector: "${selector}"`);

    addLog(`Specific iframe DOM element obtained. Scrolling it into view.`);
    await iframeElementHandler.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    addLog(`Scrolled iframe into view. Waiting for its contentFrame to be ready.`);

    const maxRetries = 10; 
    let retries = 0;
    while (retries < maxRetries) {
        newFrame = await iframeElementHandler.contentFrame();
        if (newFrame) break;
        addLog(`contentFrame is null, attempt ${retries + 1}/${maxRetries}. Waiting 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
    }

    if (!newFrame) {
        throw new Error(`Could not get content frame for iframe: "${selector}" after scrolling and multiple retries.`);
    }
    addLog(`Iframe contentFrame obtained. Waiting for frame document to be interactive/complete.`);
    
    await newFrame.waitForFunction(() => document.readyState === 'complete' || document.readyState === 'interactive', { timeout: 10000 });
    addLog(`Iframe contentFrame's document is interactive/complete.`);
    addLog(`Successfully switched to iframe: "${selector}".`);

  } catch (e: any) {
    addLog(`Error during iframe switch for selector "${selector}": ${e.message}`);
    throw new Error(`Failed to switch to iframe (selector: "${selector}"). Error: ${e.message}`);
  } finally {
    if (iframeElementHandler) {
        await iframeElementHandler.dispose();
    }
  }
  return newFrame;
} 