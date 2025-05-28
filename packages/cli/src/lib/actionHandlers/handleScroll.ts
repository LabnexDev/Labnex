import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary

export async function handleScroll(
  page: Page | null, // Included for consistency, though currentFrame is primary
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  target: string | undefined,
  originalStep: string
): Promise<void> {
  if (!currentFrame) throw new Error('Current frame not available for scroll');
  const executionContext = currentFrame;

  if (!target) {
    addLog('No scroll target specified, scrolling current context window down by a bit.');
    await executionContext.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
    return;
  }

  addLog(`Attempting to scroll with target: "${target}" in current context`);

  switch (target) {
    case 'top':
      await executionContext.evaluate(() => window.scrollTo(0, 0));
      addLog('Scrolled to top of the current context.');
      break;
    case 'bottom':
      await executionContext.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      addLog('Scrolled to bottom of the current context.');
      break;
    case 'up':
      await executionContext.evaluate(() => window.scrollBy(0, -window.innerHeight / 2));
      addLog('Scrolled up by half viewport height in current context.');
      break;
    case 'down':
      await executionContext.evaluate(() => window.scrollBy(0, window.innerHeight / 2));
      addLog('Scrolled down by half viewport height in current context.');
      break;
    default:
      addLog(`Scrolling to element identified by "${target}" in current context`);
      // Pass page and currentFrame to findElementWithFallbacks, even if page is not directly used by this handler's logic after element finding
      const elementToScrollTo = await findElementWithFallbacks(page, currentFrame, addLog, target, target, originalStep);
      if (elementToScrollTo) {
          await elementToScrollTo.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
          await elementToScrollTo.dispose();
          addLog(`Successfully scrolled to element "${target}"`);
      } else {
          // This case should ideally be handled by findElementWithFallbacks throwing an error
          throw new Error(`Scroll target element "${target}" not found.`);
      }
      break;
  }
} 