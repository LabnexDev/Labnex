import { Page, Frame } from 'puppeteer';
import { AddLogFunction } from '../elementFinder'; // Adjust path as necessary

export async function handleNavigate(
  page: Page | null,
  currentFrame: Page | Frame | null, // Though navigate resets to page, keep for consistency
  addLog: AddLogFunction,
  url?: string
): Promise<Page | Frame | null> { // Return the new currentFrame which is the page itself
  if (!page) throw new Error('Page not available');
  let newCurrentFrame = page as Page | Frame | null; // Initialize with page

  // Navigation always happens on the main page, so reset context first
  newCurrentFrame = page;
  if (!url) throw new Error('Navigation URL not provided');
  addLog(`Navigating to ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  addLog(`Navigation to ${url} complete (DOM content loaded). Attempting to dismiss potential cookie/consent banners.`);

  // Attempt to find and click common consent buttons
  const consentButtonSelectors = [
      "xpath/.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'accept')]",
      "xpath/.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'agree')]",
      "xpath/.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'got it')]",
      "xpath/.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'allow all')]",
      "xpath/.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'ok')]",
      "xpath/.//button[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'i understand')]",
      'button#hs-eu-confirmation-button', 
      'button.cc-btn.cc-dismiss',
      'button[data-testid="GDPR-accept"]',
      '[id*="consent"] button[class*="accept"]'
  ];

  let clickedConsentButton = false;
  for (const selector of consentButtonSelectors) {
      try {
          const button = await page.waitForSelector(selector, { visible: true, timeout: 2000 });
          if (button) {
              addLog(`Found potential consent button with selector: "${selector}". Attempting to click.`);
              await button.click({ delay: 100 }); 
              await button.dispose();
              addLog(`Clicked consent button. Waiting a moment for banner to disappear...`);
              await new Promise(resolve => setTimeout(resolve, 1500));
              clickedConsentButton = true;
              break; 
          }
      } catch (error) {
          // Not logging every miss to avoid spam
      }
  }

  if (clickedConsentButton) {
      addLog('A consent button was clicked. Page should be clearer now.');
  } else {
      addLog('No common consent buttons found or clicked. Continuing...');
  }
  return newCurrentFrame; // Return the page as the new current context
} 