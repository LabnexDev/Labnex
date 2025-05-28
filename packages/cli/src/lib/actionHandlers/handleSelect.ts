import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary

export async function handleSelect(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  value: string | undefined,
  originalStep: string
): Promise<void> {
  if (!page) throw new Error('Page not available');
  if (!selector) throw new Error('Select selector not provided');
  if (value === undefined) throw new Error('Value for select not provided');
  addLog(`Attempting to select option "${value}" in dropdown identified by "${selector}"`);

  const dropdownElement = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep);
  await dropdownElement.select(value);
  await dropdownElement.dispose();
  addLog(`Successfully selected option "${value}" in dropdown "${selector}"`);
} 