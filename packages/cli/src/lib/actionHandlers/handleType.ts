import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import
import inquirer from 'inquirer';

const placeholderCache: { username?: string; password?: string } = {}; // persisted per run

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

  let finalText: string = textToType;

  // Handle placeholder prompting
  const interactive = process.env.RUNNER_NON_INTERACTIVE !== 'true' && process.stdout.isTTY;

  if (finalText === '__PROMPT_VALID_USERNAME__') {
    if (!placeholderCache.username && interactive) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: 'Enter a valid username to use for this test run:',
          validate: (val: string) => val.trim() ? true : 'Username cannot be empty',
        },
      ]);
      placeholderCache.username = answer.username.trim();
    }
    if (!placeholderCache.username) {
      throw new Error('Username placeholder encountered but not provided and prompts are disabled.');
    }
    finalText = placeholderCache.username as string;
    addLog(`[PlaceholderPrompt] Filled username placeholder with user-provided value.`);
  } else if (finalText === '__PROMPT_VALID_PASSWORD__') {
    if (!placeholderCache.password && interactive) {
      const answer = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter a valid password to use for this test run:',
          mask: '*',
          validate: (val: string) => val.trim() ? true : 'Password cannot be empty',
        },
      ]);
      placeholderCache.password = answer.password;
    }
    if (!placeholderCache.password) {
      throw new Error('Password placeholder encountered but not provided and prompts are disabled.');
    }
    finalText = placeholderCache.password as string;
    addLog(`[PlaceholderPrompt] Filled password placeholder with user-provided value.`);
  }

  addLog(`Attempting to type "${finalText}" into element identified by "${selector}"`);
  const elementToTypeIn = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  if (!elementToTypeIn) {
    throw new Error('Element not found');
  }
  
  // Clear the field before typing only if it's likely to be the correct field
  const elementTag = await elementToTypeIn.evaluate((el) => el.tagName.toLowerCase());
  const elementType = await elementToTypeIn.evaluate((el) => el.getAttribute('type') || '');
  const shouldClear = (elementTag === 'input' || elementTag === 'textarea') && 
                      !(finalText.toLowerCase().includes('password') && elementType !== 'password');
  if (shouldClear) {
    await elementToTypeIn.evaluate((el: any) => {
      if (el.value !== undefined) el.value = ''; // For input, textarea
      else if (el.isContentEditable) el.textContent = ''; // For contenteditable divs
    });
    addLog(`Cleared field before typing.`);
  } else {
    addLog(`Skipped clearing field due to mismatch or password input.`);
  }

  await elementToTypeIn.type(finalText, { delay: 50 });
  await elementToTypeIn.dispose();
  addLog(`Successfully typed "${finalText}" into element "${selector}"`);

  // If the element was a password field, attempt auto submit
  if (elementType === 'password') {
    await autoSubmitIfLogin(page, currentFrame, addLog, retryApiCallFn);
  }
}

// Helper: attempt to click a likely submit/login button
async function autoSubmitIfLogin(
  page: Page,
  frame: Page | Frame,
  addLog: AddLogFunction,
  retryApiCallFn?: RetryApiCallFunction
) {
  const candidateSelectors = [
    'button[type="submit"]',
    'input[type="submit"]',
    '[id*="login" i]',
    '[class*="login" i]',
    '[data-testid*="login" i]',
    '[aria-label*="login" i]',
    '[id*="sign" i]',
    '[class*="sign" i]',
    '[data-testid*="sign" i]'
  ];

  for (const sel of candidateSelectors) {
    try {
      const element = await findElementWithFallbacks(
        page,
        frame,
        addLog,
        sel,
        sel,
        'auto-submit',
        true,
        retryApiCallFn,
        0
      );
      if (element) {
        const navPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>{});
        await element.click({ delay: 50 });
        await navPromise;
        try { await page.waitForSelector('.inventory_item_name', { timeout: 10000 }); } catch {}
        addLog(`[AutoSubmit] Clicked potential submit button: ${sel}`);
        await page.evaluate(()=>{ (window as any).__labnexSubmitted = true; });
        await element.dispose();
        return true;
      }
    } catch {
      // ignore and continue
    }
  }

  // Fallback: press Enter key on page
  const navPromiseKey = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(()=>{});
  await page.keyboard.press('Enter');
  await navPromiseKey;
  try { await page.waitForSelector('.inventory_item_name', { timeout: 10000 }); } catch {}
  await page.evaluate(()=>{ (window as any).__labnexSubmitted = true; });
  addLog('[AutoSubmit] Pressed Enter key as fallback submit.');
  return true;
} 