import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction } from '../elementFinderV2';

export async function handleSwitchToIframe(
  page: Page | null,
  addLog: AddLogFunction,
  selector?: string
): Promise<Frame | null> {
  if (!page) throw new Error('Page not available for switching to iframe');
  if (!selector) throw new Error('Iframe selector not provided for switching');
  
  addLog(`[SwitchToIframe] Looking for iframe: "${selector}"`);

  try {
    // Quick check for any iframes on the page
    const hasIframes = await page.evaluate(() => document.querySelectorAll('iframe').length > 0);
    if (!hasIframes) {
      addLog('[SwitchToIframe] No iframes found on page');
      return null;
    }

    // Clean the selector
    const cleanSelector = selector.replace(/^xpath:/, '').trim();
    let iframeElement: ElementHandle<HTMLIFrameElement> | null = null;

    // Try to find the iframe quickly
    if (selector.startsWith('xpath:')) {
      // XPath selector
      addLog(`[SwitchToIframe] Trying XPath selector: ${cleanSelector}`);
      const elements = await (page as any).$x(cleanSelector);
      if (elements.length > 0) {
        iframeElement = elements[0] as ElementHandle<HTMLIFrameElement>;
      }
    } else {
      // CSS selector
      addLog(`[SwitchToIframe] Trying CSS selector: ${cleanSelector}`);
      iframeElement = await page.$(cleanSelector) as ElementHandle<HTMLIFrameElement>;
    }

    // If specific selector didn't work, try fallback strategies
    if (!iframeElement) {
      addLog('[SwitchToIframe] Primary selector failed, trying fallbacks...');
      
      const fallbackSelectors = [
        'iframe.demo-frame',
        'iframe[class*="demo"]',
        'iframe[src*="photo"]',
        'iframe[src*="gallery"]',
        'iframe[src*="drag"]',
        'iframe:not([src*="google"]):not([src*="ad"])', // Avoid ad iframes
      ];

      for (const fallback of fallbackSelectors) {
        try {
          iframeElement = await page.$(fallback) as ElementHandle<HTMLIFrameElement>;
          if (iframeElement) {
            addLog(`[SwitchToIframe] Found iframe using fallback: ${fallback}`);
            break;
          }
        } catch (error) {
          // Continue to next fallback
        }
      }
    }

    // Last resort: find the largest non-ad iframe
    if (!iframeElement) {
      addLog('[SwitchToIframe] All selectors failed, finding largest visible iframe...');
      const iframes = await page.$$('iframe');
      let largestIframe = null;
      let maxArea = 0;

      for (const iframe of iframes) {
        try {
          const src = await iframe.evaluate((el: HTMLIFrameElement) => el.src);
          // Skip ad iframes
          if (src && (src.includes('google') || src.includes('ad') || src.includes('doubleclick'))) {
            continue;
          }

          const rect = await iframe.boundingBox();
          if (rect && rect.width * rect.height > maxArea) {
            maxArea = rect.width * rect.height;
            largestIframe = iframe;
          }
        } catch (error) {
          // Skip this iframe
        }
      }

      if (largestIframe) {
        iframeElement = largestIframe as ElementHandle<HTMLIFrameElement>;
        addLog(`[SwitchToIframe] Using largest iframe (area: ${maxArea})`);
      }
    }

    if (!iframeElement) {
      addLog('[SwitchToIframe] No suitable iframe found');
      return null;
    }

    // Get the frame content
    const frame = await iframeElement.contentFrame();
    if (!frame) {
      addLog('[SwitchToIframe] Could not access iframe content');
      return null;
    }

    // Quick content verification with short timeout
    try {
      await frame.waitForSelector('body', { timeout: 5000 });
    } catch (error) {
      // Continue anyway, content might still be usable
      addLog('[SwitchToIframe] Content may still be loading, continuing...');
    }

    // Log basic iframe info
    try {
      const src = await iframeElement.evaluate((el: HTMLIFrameElement) => el.src);
      addLog(`[SwitchToIframe] ✓ Switched to iframe (src: ${src.substring(0, 100)}...)`);
    } catch (error) {
      addLog('[SwitchToIframe] ✓ Switched to iframe');
    }

    return frame;

  } catch (error: any) {
    addLog(`[SwitchToIframe] Error: ${error.message}`);
    return null;
  }
} 