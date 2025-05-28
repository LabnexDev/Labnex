import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary

export async function handleUpload(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  filePath: string | undefined,
  originalStep: string
): Promise<void> {
  if (!page) throw new Error('Page not available for upload'); // Ensure page context for consistency, even if element finding uses currentFrame
  if (!selector) throw new Error('Upload selector (for file input) not provided');
  if (!filePath) throw new Error('File path for upload not provided');

  addLog(`Attempting to upload file "${filePath}" to element identified by "${selector}"`);

  const element = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep);
  let inputElementHandle: ElementHandle<HTMLInputElement> | null = null;

  try {
    const tagName = await element.evaluate(el => el.tagName.toLowerCase());
    if (tagName !== 'input') {
      throw new Error(`Element for upload selector "${selector}" is not an input element, but a <${tagName}>.`);
    }
    
    inputElementHandle = element as ElementHandle<HTMLInputElement>;
    
    const inputType = await inputElementHandle.evaluate(el => el.type.toLowerCase());
    if (inputType !== 'file') {
      addLog(`Warning: Element for upload selector "${selector}" is an <input> but not type="file" (it's type="${inputType}"). Attempting upload anyway.`);
    }

    await inputElementHandle.uploadFile(filePath);
    addLog(`Successfully uploaded file "${filePath}" to element "${selector}" (type: ${inputType})`);
  } finally {
    if (inputElementHandle && inputElementHandle !== element) { 
      await inputElementHandle.dispose();
    } else if (element) {
      await element.dispose();
    }
  }
} 