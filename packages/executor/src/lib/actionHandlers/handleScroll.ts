import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import

export async function handleScroll(
  page: Page | null, // Included for consistency, though currentFrame is primary
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  target: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction // Added
): Promise<void> {
  if (!page) throw new Error('Page not available for scroll');
  if (!currentFrame) throw new Error('Current frame not available for scroll');
  const executionContext = currentFrame;

  if (!target) {
    addLog('No scroll target specified, scrolling current context window down by a bit.');
    await executionContext.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    return;
  }

  addLog(`Attempting to scroll with target: "${target}" in current context`);
  let elementToScrollTo: ElementHandle | null = null;
  try {
    // Try to find the element if a target is specified
    // Pass page and currentFrame to findElementWithFallbacks, even if page is not directly used by this handler's logic after element finding
    elementToScrollTo = await findElementWithFallbacks(page, currentFrame, addLog, target, target, originalStep, false, retryApiCallFn);
    if (elementToScrollTo) {
      addLog('Element found, scrolling it into view.');
      await elementToScrollTo.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      // Add a small delay to allow smooth scroll to finish and content to settle.
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog('Successfully scrolled to element.');
    } else {
      // This case should ideally be handled by findElementWithFallbacks throwing an error
      addLog('Scroll target element not found, attempting generic page scroll as fallback.');
      await executionContext.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    }
  } catch (error) {
    addLog(`Error scrolling to target "${target}": ${(error as Error).message}. Attempting generic page scroll.`);
    // Fallback to generic scroll if specific element scroll fails
    await executionContext.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
  } finally {
    if (elementToScrollTo) {
      await elementToScrollTo.dispose();
    }
  }
} 