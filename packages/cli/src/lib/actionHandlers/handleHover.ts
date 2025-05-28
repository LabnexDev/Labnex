import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary

export async function handleHover(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  originalStep: string
): Promise<void> {
  if (!page) throw new Error('Page not available');
  if (!selector) throw new Error('Hover selector not provided');
  addLog(`Attempting to hover over element identified by "${selector}"`);

  const elementToHover = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep);
  await elementToHover.hover();
  await elementToHover.dispose();
  addLog(`Successfully hovered over element "${selector}"`);
} 