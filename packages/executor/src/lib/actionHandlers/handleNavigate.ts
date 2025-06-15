import { Page, Frame } from 'puppeteer';
import { AddLogFunction } from '../elementFinderV2'; // Updated import

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

  // Validate URL
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Invalid URL protocol. Only http and https are allowed.');
    }
  } catch (e) {
    throw new Error(`Invalid URL for navigation: ${url}. ${(e as Error).message}`);
  }

  addLog(`Navigating to ${url}`);
  const navigationOptions: any = {
    waitUntil: 'domcontentloaded',
    timeout: 60000 // Default timeout
  };

  if (url.includes('w3schools.com/jsref/tryit.asp') || url.includes('w3schools.com/code/tryit.asp')) {
    addLog('[W3Schools Tryit Specific] Using "networkidle0" event and extended timeout for tryit page.');
    navigationOptions.waitUntil = 'networkidle0';
    navigationOptions.timeout = 120000; // Extended timeout for networkidle0 to 120 seconds
  }

  // Add more detailed error listeners for navigation
  const pageErrorHandler = (error: Error) => addLog(`[Navigation Page Error] ${error.message}`);
  const requestFailedHandler = (request: any) => {
    if (request.failure() && request.failure().errorText !== 'net::ERR_ABORTED') {
      addLog(`[Navigation Request Failed] URL: ${request.url()}, Error: ${request.failure().errorText}`);
    }
  };

  if (page) {
    page.on('pageerror', pageErrorHandler);
    page.on('requestfailed', requestFailedHandler);
  }

  try {
    await page.goto(url, navigationOptions);
    addLog(`Navigation to ${url} complete (${navigationOptions.waitUntil} event fired).`);

    // Post-navigation check for tryit.asp pages to ensure page is responsive
    if (url.includes('w3schools.com/jsref/tryit.asp') || url.includes('w3schools.com/code/tryit.asp')) {
      addLog('[W3Schools Tryit Specific] Performing post-navigation responsiveness check...');
      try {
        await page.evaluate(() => 1 === 1); // Simple evaluation to check if page context is alive
        addLog('[W3Schools Tryit Specific] Page is responsive after navigation.');

        // Attempt to close login/signup prompt specifically for tryit pages
        const closeLoginPromptSelector = '#mypagediv > .fa-times';
        const loginPromptCloseButton = await page.$(closeLoginPromptSelector);
        if (loginPromptCloseButton) {
          const isVisible = await loginPromptCloseButton.isIntersectingViewport();
          if (isVisible) {
            addLog(`[W3Schools Tryit Specific] Found login/signup prompt close button: ${closeLoginPromptSelector}. Clicking it.`);
            await loginPromptCloseButton.click();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for it to disappear
            addLog('[W3Schools Tryit Specific] Clicked login/signup prompt close button.');
          } else {
            addLog(`[W3Schools Tryit Specific] Login/signup prompt close button ${closeLoginPromptSelector} found but not visible.`);
          }
        } else {
          addLog('[W3Schools Tryit Specific] Login/signup prompt close button not found.');
        }
      } catch (evalError) {
        addLog(`[W3Schools Tryit Specific] Page responsiveness check failed or login prompt closure error: ${(evalError as Error).message}`);
        // Potentially re-throw or handle as a navigation failure if this is critical
      }
    }

  } catch (e) {
    addLog(`Error during page.goto or post-navigation checks: ${(e as Error).message}`);
    throw e; // Re-throw the error after logging
  } finally {
    if (page) {
      page.off('pageerror', pageErrorHandler);
      page.off('requestfailed', requestFailedHandler);
    }
  }
  
  addLog(`Navigation to ${url} complete (${navigationOptions.waitUntil} event fired). Attempting to dismiss potential cookie/consent banners.`);

  // Attempt to find and click common consent buttons
  const consentSelectors = [
    'div#snigel-cmp-framework button.accept-choices-button', // More specific Snigel v2 button
    '#snigel-cmp-widget #snigel-cmp-framework button.snigel-cmp-button.snigel-cmp-accept-all', // Cookie consent (seen 2024)
    '#accept-choices', // Another cookie consent button
    'button[aria-label="Close Welcome Banner"]', // Welcome banner
    'button[data-testid="dialog-close"]', // Common test id for close buttons
    'button[aria-label="dismiss cookie message"]' // Another common aria label
  ];

  let clickedConsentButton = false;
  for (const selector of consentSelectors) {
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

  addLog('Adding a short delay for page stabilization after navigation and consent checks.');
  await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5-second delay

  return newCurrentFrame; // Return the page as the new current context
} 