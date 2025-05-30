import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import

export async function handleHover(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!page) throw new Error('Page not available for hover');
  if (!currentFrame) throw new Error('Current frame not available for hover');
  if (!selector) throw new Error('Hover selector not provided');
  addLog(`Attempting to hover over element identified by: "${selector}"`);

  const elementToHover = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  if (!elementToHover) {
    throw new Error('Element not found');
  }
  await elementToHover.hover();
  await new Promise(resolve => setTimeout(resolve, 300));
  await elementToHover.dispose();
  addLog(`Successfully hovered over element identified by "${selector}"`);
} 