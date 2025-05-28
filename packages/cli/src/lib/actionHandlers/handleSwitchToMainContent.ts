import { Page, Frame } from 'puppeteer';
import { AddLogFunction } from '../elementFinder'; // Adjust path as necessary

export function handleSwitchToMainContent(
  page: Page | null,
  addLog: AddLogFunction
): Page | Frame | null { // Return the new currentFrame which is the page itself
  if (!page) throw new Error('Page not available for switching to main content');
  addLog('Switching to main content');
  addLog('Successfully switched to main content');
  return page; // The main page becomes the current frame
} 