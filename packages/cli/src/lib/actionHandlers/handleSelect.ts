import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinder'; // Adjust path as necessary

export async function handleSelect(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  value: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!currentFrame) throw new Error('Current frame not available for select');
  if (!selector) throw new Error('Select selector not provided');
  if (!value) throw new Error('Value not provided for select action');

  addLog(`Attempting to select value "${value}" in dropdown identified by: "${selector}"`);
  const dropdownElement = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  
  // Attempt to select by value first, then by visible text as a fallback
  try {
    await dropdownElement.select(value);
    addLog(`Successfully selected option with value/text "${value}".`);
  } catch (error) {
    addLog(`Could not select by value "${value}". Attempting to select by visible text matching "${value}"...`);
    // Puppeteer's select does not directly support selecting by visible text if the value attribute differs.
    // We need to find the option element that has the matching text.
    const optionToSelect = await dropdownElement.evaluateHandle((selectEl, text) => {
      const options = Array.from((selectEl as HTMLSelectElement).options);
      const foundOption = options.find(opt => opt.text.trim() === text.trim() || opt.label.trim() === text.trim());
      return foundOption;
    }, value);

    if (optionToSelect && optionToSelect.asElement()) {
      const optionValue = await (optionToSelect.asElement() as ElementHandle<HTMLOptionElement>)!.evaluate((opt: HTMLOptionElement) => opt.value);
      await dropdownElement.select(optionValue);
      addLog(`Successfully selected option by visible text "${value}" (actual value: "${optionValue}").`);
      await optionToSelect.dispose();
    } else {
      if (optionToSelect) await optionToSelect.dispose(); // Dispose if it's a JSHandle but not an element
      throw new Error(`Could not find an option with value or visible text matching "${value}" in dropdown "${selector}".`);
    }
  }
  await dropdownElement.dispose();
} 