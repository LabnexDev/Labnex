import { Page, Frame } from 'puppeteer'; // Page might not be strictly needed but good for context
import { AddLogFunction } from '../elementFinderV2'; // Updated import

export async function handleWait(
  page: Page | null, // Included for consistency, though not directly used here
  addLog: AddLogFunction,
  timeout?: number
): Promise<void> {
  if (!page) throw new Error('Page context not available for wait. This check is for consistency, even if page is not directly used in this handler.');
  const waitTime = timeout || 3000; // Default wait
  addLog(`Waiting for ${waitTime}ms`);
  await new Promise(resolve => setTimeout(resolve, waitTime));
} 