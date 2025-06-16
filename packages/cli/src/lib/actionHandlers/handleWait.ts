import { Page, Frame } from 'puppeteer'; // Page might not be strictly needed but good for context
import { AddLogFunction } from '../elementFinderV2'; // Updated import

export async function handleWait(
  page: Page | Frame | null,
  addLog: AddLogFunction,
  selectorOrTimeout?: string | number,
  timeoutMs = 10000
): Promise<void> {
  if (!page) throw new Error('Page context not available for wait.');

  if (typeof selectorOrTimeout === 'number' || !selectorOrTimeout) {
    const waitTime = (selectorOrTimeout as number) || 3000;
    addLog(`Waiting for ${waitTime}ms`);
    await new Promise(res => setTimeout(res, waitTime));
    return;
  }

  const selector = selectorOrTimeout as string;
  addLog(`[HandleWait] Waiting for selector: ${selector} (timeout ${timeoutMs}ms)`);
  try {
    await (page as Page).waitForSelector(selector, { timeout: timeoutMs });
    addLog('[HandleWait] Selector appeared.');
  } catch {
    addLog('[HandleWait] Timeout waiting for selector.');
  }
} 