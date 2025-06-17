import { AddLogFunction } from '../elementFinderV2';
import { Page, Frame } from 'puppeteer';

export async function handleSkip(
  _page: Page | Frame | null,
  addLog: AddLogFunction,
  reason?: string
): Promise<void> {
  addLog(`[Skip] Step intentionally skipped${reason ? `: ${reason}` : ''}`);
} 