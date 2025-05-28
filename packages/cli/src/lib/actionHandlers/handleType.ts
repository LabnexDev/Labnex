import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary

export async function handleType(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  text: string | undefined,
  originalStep: string
): Promise<void> {
  if (!page) throw new Error('Page not available');
  if (!selector) throw new Error('Type selector not provided');
  if (text === undefined) throw new Error('Text to type not provided');
  addLog(`Attempting to type "${text}" into element identified by: "${selector}"`);

  const elementToTypeIn = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep);

  // Heuristic for search inputs
  const tagName = await elementToTypeIn.evaluate(el => el.tagName.toLowerCase());
  const nameAttr = await elementToTypeIn.evaluate(el => el.getAttribute('name'));
  const typeAttr = await elementToTypeIn.evaluate(el => el.getAttribute('type'));
  const placeholderAttr = await elementToTypeIn.evaluate(el => el.getAttribute('placeholder'));

  if (
    (tagName === 'input' && (nameAttr?.includes('q') || typeAttr === 'search' || placeholderAttr?.toLowerCase().includes('search'))) ||
    (tagName === 'textarea' && nameAttr?.includes('q'))
  ) {
      addLog('Common search input detected, adding small delay for page stability...');
      await new Promise(resolve => setTimeout(resolve, 750));
  }
  
  await elementToTypeIn.type(text);
  await elementToTypeIn.dispose();
  addLog(`Successfully typed "${text}" into element identified by "${selector}"`);
} 