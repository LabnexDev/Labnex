import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import

export async function handleSelect(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  value: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!page) throw new Error('Page not available for select');
  if (!currentFrame) throw new Error('Current frame not available for select');
  if (!selector) throw new Error('Select selector not provided');
  if (!value) throw new Error('Value not provided for select action');

  addLog(`Attempting to select value "${value}" in dropdown identified by: "${selector}"`);
  const dropdownElement = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  if (!dropdownElement) {
    throw new Error('Element not found');
  }

  // Check if it's a standard select element
  const isSelectElement = await dropdownElement.evaluate(el => el.tagName.toLowerCase() === 'select');
  
  if (isSelectElement) {
    // Handle standard <select> dropdown
    try {
      await dropdownElement.select(value);
      addLog(`Successfully selected value "${value}" in select dropdown`);
    } catch (selectError) {
      // Fallback: try clicking and finding the option
      addLog(`Direct select failed, trying click approach: ${(selectError as Error).message}`);
      await dropdownElement.click();
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for dropdown to open
      
      // Try to find and click the option
      const optionSelector = `option[value="${value}"], option:contains("${value}")`;
      try {
        await dropdownElement.select(value);
        addLog(`Successfully selected "${value}" using fallback approach`);
      } catch (fallbackError) {
        throw new Error(`Failed to select value "${value}": ${(fallbackError as Error).message}`);
      }
    }
  } else {
    // Handle custom dropdown (click-based)
    addLog('Non-standard select element detected, using click-based selection');
    await dropdownElement.click();
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for dropdown to open
    
    // Try multiple selectors for the option
    const optionSelectors = [
      `[data-value="${value}"]`,
      `[value="${value}"]`,
      `li:contains("${value}")`,
      `div:contains("${value}")`,
      `span:contains("${value}")`,
      `option:contains("${value}")`
    ];
    
    let optionClicked = false;
    for (const optionSel of optionSelectors) {
      try {
        const optionElement = await page.waitForSelector(optionSel, { visible: true, timeout: 2000 });
        if (optionElement) {
          await optionElement.click();
          addLog(`Successfully clicked option "${value}" using selector: ${optionSel}`);
          optionClicked = true;
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!optionClicked) {
      throw new Error(`Could not find option "${value}" in custom dropdown`);
    }
  }
  
  await dropdownElement.dispose();
} 