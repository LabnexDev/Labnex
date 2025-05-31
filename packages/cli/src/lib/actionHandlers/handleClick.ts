import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import
import { extractHintedSelector } from '../parserHelpers/extractHintedSelector'; // Ensure this is imported

export async function handleClick(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  selector: string, // This can be a raw selector or a complex string like "(type: selector)"
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!page) throw new Error('Page not available');
  if (!currentFrame) throw new Error('Frame not available');
  if (!selector) throw new Error('Click selector not provided');
  addLog(`Attempting to click on element identified by: "${selector}"`);
  
  // Extract the core selector value for accurate checking
  const hintExtraction = extractHintedSelector(selector);
  const coreSelectorValue = hintExtraction.selectorValue || selector; // Fallback to raw selector if no hint
  addLog(`[handleClick Verbose] Original Selector: "${selector}"`);
  addLog(`[handleClick Verbose] Extracted Hint: type=${hintExtraction.type || 'none'}, selectorValue=${hintExtraction.selectorValue || 'none'}`);
  addLog(`[handleClick Verbose] Core Selector Value for Check: "${coreSelectorValue}"`);

  const w3schoolsModalButtonSelectors = [
    "xpath://button[text()='Open Modal']",
    "xpath://button[contains(text(),'Open Modal')]",
    "#myBtn",
    "(id: myBtn)" // Common way Playwright might represent it or AI might generate it
  ];
  
  let isW3SchoolsModalButton = false;
  for (const btnSelector of w3schoolsModalButtonSelectors) {
    if (coreSelectorValue.includes(btnSelector) || selector.includes(btnSelector)) {
      isW3SchoolsModalButton = true;
      addLog(`[handleClick Verbose] Is W3Schools Modal Button: true (matched "${btnSelector}")`);
      break;
    }
  }
  if (!isW3SchoolsModalButton) {
    addLog(`[handleClick Verbose] Is W3Schools Modal Button: false`);
  }

  addLog(`[handleClick Verbose] Page URL: ${page.url()}`);
  
  let frameContextLogMessage = 'Main Frame';
  // If currentFrame is not strictly the page object itself, it's an iframe.
  if (currentFrame !== page) { 
    const frameInstance = currentFrame as Frame; // It must be a Frame if not the Page
    const frameName = frameInstance.name ? frameInstance.name() : 'N/A';
    const frameUrl = frameInstance.url ? frameInstance.url() : 'N/A';
    frameContextLogMessage = `Frame (Name: ${frameName}, URL: ${frameUrl})`;
  } else {
    frameContextLogMessage = `Main Frame (URL: ${page.url()})`; 
  }
  addLog(`[handleClick Verbose] Context: ${frameContextLogMessage}`);

  if (page.url().includes('w3schools.com') && isW3SchoolsModalButton) {
    addLog('[W3Schools Pre-Click] Page URL includes \'w3schools.com\'. isW3SchoolsModalButton: true.');

    const originalFrameForOverlayLogic = currentFrame; // Store the original frame for overlay logic
    let CtxForOverlayDismissal = currentFrame;
    let switchedToMainFrameForOverlay = false;

    try {
      // If current context for overlay dismissal is not the page itself, it's an iframe
      if (CtxForOverlayDismissal !== page) { 
        addLog('[W3Schools Pre-Click] Current context is an iframe. Switching to main frame for overlay dismissal.');
        CtxForOverlayDismissal = page; // Switch to the main page object for overlays
        switchedToMainFrameForOverlay = true;
      }

      addLog('[W3Schools Pre-Click] Attempting to dismiss common overlays (on main frame if applicable)...');
      const overlaySelectors = [
        '#snigel-cmp-widget #snigel-cmp-framework button.snigel-cmp-button.snigel-cmp-accept-all',
        '#accept-choices',
        'button[aria-label="Close Welcome Banner"]',
        'button[id^="close-"]',
        '#signup_prompt_background + #signup_prompt > .w3-modal-content > .w3-container > .w3-display-topright',
        '#mypagediv > .fa-times'
      ];

      for (const overlaySel of overlaySelectors) {
        try {
          const overlayButton = await (CtxForOverlayDismissal as Page | Frame).$(overlaySel);
          if (overlayButton) {
            addLog(`[W3Schools Pre-Click] Found overlay: "${overlaySel}". Attempting to click.`);
            await overlayButton.click({ delay: 50 });
            await overlayButton.dispose();
            addLog(`[W3Schools Pre-Click] Clicked overlay: "${overlaySel}". Waiting for a moment.`);
            // await page.waitForTimeout(500); // Commented out temporarily
          }
        } catch (e) {
          addLog(`[W3Schools Pre-Click] Error interacting with overlay "${overlaySel}": ${(e as Error).message.split('\n')[0]}`);
        }
      }
      addLog('[W3Schools Pre-Click] Finished attempting to dismiss overlays.');

    } finally {
      if (switchedToMainFrameForOverlay && originalFrameForOverlayLogic) {
        addLog('[W3Schools Pre-Click] Switching back to original iframe context for click.');
        // The actual click target (currentFrame) should not be modified here,
        // findElementWithFallbacks will use the original currentFrame passed to handleClick
      }
    }
  }

  // Effective context for finding the *actual click target* remains the original currentFrame
  let effectiveTargetFrameLogMessage = 'Main Frame';
  if (currentFrame !== page) { // Check against the page object itself
    const frameInstance = currentFrame as Frame;
    const frameName = frameInstance.name ? frameInstance.name() : 'N/A';
    const frameUrl = frameInstance.url ? frameInstance.url() : 'N/A';
    effectiveTargetFrameLogMessage = `Frame (Name: ${frameName}, URL: ${frameUrl})`;
  } else {
    effectiveTargetFrameLogMessage = `Main Frame (URL: ${page.url()})`;
  }
  addLog(`[handleClick Verbose] Effective context for finding element: ${effectiveTargetFrameLogMessage}`);

  const elementToClick = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, originalStep, false, retryApiCallFn);
  if (!elementToClick) {
    throw new Error('Element not found');
  }
  // Scroll element into view before clicking
  addLog('Scrolling element into view before clicking.');
  await elementToClick.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  try {
    await elementToClick.click();
    addLog('Click successful.');
  } catch (clickError) {
    addLog(`Standard click failed for selector "${selector}": ${(clickError as Error).message}`);
    if (isW3SchoolsModalButton) {
      addLog('[DIAGNOSTIC_W3SCHOOLS] Standard click failed for modal button. Attempting JavaScript click fallback.');
      try {
        await page.evaluate((sel) => {
          const el = document.querySelector(sel) || document.evaluate(sel, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
          if (el && typeof (el as HTMLElement).click === 'function') {
            (el as HTMLElement).click();
          } else {
            throw new Error('Element not found for JS click or not clickable.');
          }
        }, selector.startsWith('xpath:') ? selector.substring(6) : selector); // page.evaluate needs CSS selector or careful XPath handling
        addLog('[DIAGNOSTIC_W3SCHOOLS] JavaScript click fallback successful.');
      } catch (jsClickError) {
        addLog(`[DIAGNOSTIC_W3SCHOOLS] JavaScript click fallback ALSO failed: ${(jsClickError as Error).message}`);
        throw clickError; // Re-throw original click error if JS click also fails
      }
    } else {
      throw clickError; // Re-throw for non-W3S modal button errors
    }
  }
} 