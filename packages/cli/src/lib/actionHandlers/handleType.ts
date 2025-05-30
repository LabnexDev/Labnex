import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import

export async function handleType(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  textToType: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!page) throw new Error('Page not available for type');
  if (!currentFrame) throw new Error('Current frame not available for type');
  if (!selector) throw new Error('Type selector not provided');
  if (textToType === undefined) throw new Error('Text to type not provided');

  addLog(`Attempting to type "${textToType}" into element identified by "${selector}"`);
  const elementToTypeIn = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  if (!elementToTypeIn) {
    throw new Error('Element not found');
  }
  
  // Clear the field before typing
  await elementToTypeIn.evaluate((el: any) => {
    if (el.value !== undefined) el.value = ''; // For input, textarea
    else if (el.isContentEditable) el.textContent = ''; // For contenteditable divs
  });

  await elementToTypeIn.type(textToType, { delay: 50 });
  await elementToTypeIn.dispose();
  addLog(`Successfully typed "${textToType}" into element "${selector}"`);
} 