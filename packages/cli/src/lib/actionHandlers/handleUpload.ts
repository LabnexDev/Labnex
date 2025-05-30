import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import
import * as path from 'path';
import * as fs from 'fs';

export async function handleUpload(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string | undefined,
  filePath: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction // Added
): Promise<void> {
  if (!page) throw new Error('Page not available for upload');
  if (!currentFrame) throw new Error('Current frame not available for upload');
  if (!selector) throw new Error('Upload selector not provided');
  if (!filePath) throw new Error('File path not provided for upload');

  const absoluteFilePath = path.resolve(filePath);
  if (!fs.existsSync(absoluteFilePath)) {
    throw new Error(`File not found at path: ${absoluteFilePath}`);
  }

  addLog(`Attempting to upload file "${absoluteFilePath}" to element identified by "${selector}"`);
  const element = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  if (!element) {
    throw new Error('Element not found');
  }
  
  // Ensure the element is an input type=file
  const isFileInput = await element.evaluate(el => el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'file');
  if (!isFileInput) {
    await element.dispose();
    throw new Error(`Element identified by "${selector}" is not a file input element.`);
  }

  await (element as ElementHandle<HTMLInputElement>).uploadFile(absoluteFilePath);
  await element.dispose();
  addLog(`Successfully uploaded file "${absoluteFilePath}" to element "${selector}"`);
} 