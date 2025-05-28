import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinder'; // Adjust path as necessary

export async function handleClick(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!page) throw new Error('Page not available');
  if (!selector) throw new Error('Click selector not provided');
  addLog(`Attempting to click on element identified by: "${selector}"`);
  
  const elementToClick = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  await elementToClick.click();
  await elementToClick.dispose();
  addLog(`Successfully clicked element identified by "${selector}"`);
} 