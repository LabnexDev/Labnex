import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks, RetryApiCallFunction } from '../elementFinderV2'; // Updated import
import { extractHintedSelector } from '../parserHelpers/extractHintedSelector'; // Added import

export async function handleDragAndDrop(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  sourceSelectorOrText: string,
  destinationSelectorOrText: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!currentFrame) throw new Error('Current frame not available for drag and drop');
  if (!page) throw new Error('Page context not available for drag and drop');
  if (!sourceSelectorOrText) throw new Error('Source selector not provided for drag and drop');
  if (!destinationSelectorOrText) throw new Error('Destination selector not provided for drag and drop');

  addLog('[handleDragAndDrop] Attempting to reset mouse state before operation.');
  try {
    await page.mouse.reset();
    addLog('[handleDragAndDrop] Mouse state reset successful.');
  } catch (resetError: any) {
    addLog(`[handleDragAndDrop] Warning: Mouse reset failed: ${resetError.message}. Proceeding cautiously.`);
  }

  // Check if currently in an iframe context
  const isInIframe = currentFrame !== page;
  if (isInIframe) {
    addLog('[handleDragAndDrop] Currently in an iframe. Starting a 7-second pause for content to load.');
    await new Promise(resolve => setTimeout(resolve, 7000));
    addLog('[handleDragAndDrop] 7-second iframe pause COMPLETED.');
  } else {
    addLog('[handleDragAndDrop] Not in an iframe. Proceeding directly.');
  }

  addLog(`Attempting to find source element: "${sourceSelectorOrText}"`);
  const sourceElement = await findElementWithFallbacks(
    page, currentFrame, addLog, sourceSelectorOrText, 
    `source element (${sourceSelectorOrText})`, 
    originalStep, false, retryApiCallFn
  );
  addLog(`Attempting to find destination element: "${destinationSelectorOrText}"`);
  const destinationElement = await findElementWithFallbacks(
    page, currentFrame, addLog, destinationSelectorOrText, 
    `destination element (${destinationSelectorOrText})`, 
    originalStep, false, retryApiCallFn
  );

  if (!sourceElement || !destinationElement) {
    if (sourceElement) await sourceElement.dispose();
    if (destinationElement) await destinationElement.dispose();
    throw new Error('Source or destination element not found for drag and drop.');
  }

  addLog('[handleDragAndDrop] Ensuring elements are scrolled into view.');
  await sourceElement.evaluate(el => el.scrollIntoView());
  await destinationElement.evaluate(el => el.scrollIntoView());
  await new Promise(resolve => setTimeout(resolve, 100)); // Brief pause after scroll, corrected usage

  const DRAG_AND_DROP_TIMEOUT = 60000; // 60 seconds timeout for the entire operation
  let nativeDragDropSuccessful = false;

  // --- Heuristic for problematic D&D sites ---
  let alwaysUseFallback = false;
  try {
    const currentPageUrlForCheck = page.url();
    if (currentPageUrlForCheck && currentPageUrlForCheck.includes('globalsqa.com/demo-site/draganddrop')) {
      addLog('[DND Heuristic] GlobalsQA D&D page detected. Forcing fallback.');
      alwaysUseFallback = true;
    }
  } catch (urlError) {
    const errorMessage = (urlError instanceof Error) ? urlError.message : 'Unknown URL check error';
    addLog(`[DND Heuristic] Error checking URL: ${errorMessage}`);
  }
  // --- End Heuristic ---

  addLog(`Attempting drag from source to destination using Puppeteer\'s built-in dragAndDrop.`);
  
  if (!alwaysUseFallback) {
    try {
      await sourceElement.dragAndDrop(destinationElement);
      addLog('Drag and drop successful using native method.');
      nativeDragDropSuccessful = true;
    } catch (error: any) {
      addLog(`Native dragAndDrop failed: ${error.message}. Attempting fallback mouse events.`);
      // Reset mouse state only if native drag failed and we are about to try fallback
      addLog('[handleDragAndDrop] Attempting to reset mouse state before fallback D&D (after native failure).');
      try {
        await page.mouse.reset();
        addLog('[handleDragAndDrop] Mouse state reset before fallback D&D (after native failure) successful.');
      } catch (resetError: any) {
        addLog(`[handleDragAndDrop] Warning: Mouse reset before fallback D&D (after native failure) failed: ${resetError.message}.`);
      }
    }
  } else {
    addLog('[handleDragAndDrop] Skipping native dragAndDrop due to \'alwaysUseFallback\' heuristic for GlobalsQA.');
    // Ensure mouse is reset if we are forcing fallback from the start
    addLog('[handleDragAndDrop] Attempting to reset mouse state before forced fallback D&D (GlobalsQA heuristic).');
    try {
      await page.mouse.reset();
      addLog('[handleDragAndDrop] Mouse state reset before forced fallback D&D (GlobalsQA heuristic) successful.');
    } catch (resetError: any) {
      addLog(`[handleDragAndDrop] Warning: Mouse reset before forced fallback D&D (GlobalsQA heuristic) failed: ${resetError.message}.`);
    }
    // nativeDragDropSuccessful remains false, so the next block will execute the fallback
  }

  if (!nativeDragDropSuccessful) { // This condition now correctly covers both native failure and forced fallback for GlobalsQA
    if (alwaysUseFallback) {
        addLog('[handleDragAndDrop] Proceeding to fallback mouse event simulation due to GlobalsQA heuristic (native D&D was skipped).');
    } else {
        // This case means nativeDragDropSuccessful is false AND alwaysUseFallback was false (i.e. native D&D was tried and failed for a non-GlobalsQA site)
        addLog('[handleDragAndDrop] Native dragAndDrop failed. Proceeding to fallback mouse event simulation.');
    }
    try {
      addLog('[handleDragAndDrop] Disabling drag interception for fallback mouse events.');
      await page.setDragInterception(false); // Disable for manual mouse events

      await Promise.race([
        (async () => {
          const sourceBox = await sourceElement.boundingBox();
          const destinationBox = await destinationElement.boundingBox();

          if (!sourceBox || !destinationBox) {
            throw new Error('Could not get bounding box for source or destination element for drag and drop fallback.');
          }
          addLog(`[DND Fallback] Source Box: ${JSON.stringify(sourceBox)}`);
          addLog(`[DND Fallback] Destination Box: ${JSON.stringify(destinationBox)}`);

          addLog('Performing drag and drop using simulated mouse events.');
          const mouseController = page.mouse;

          let mouseDownSuccessful = false;
          try {
            addLog('[DND Fallback] Hovering over source element center.');
            await sourceElement.hover(); // Use Puppeteer's hover
            await new Promise(resolve => setTimeout(resolve, 100)); // Pause after hover

            addLog('[DND Fallback] Moving to source element center for mousedown.');
            await mouseController.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2, { steps: 5 });
            addLog('[DND Fallback] Performing mouse down on source.');
            await mouseController.down();
            mouseDownSuccessful = true;
            addLog('[DND Fallback] Mouse down successful. Waiting 200ms.');
            await new Promise(resolve => setTimeout(resolve, 200)); 

            addLog('[DND Fallback] Moving to destination element center.');
            await mouseController.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2, { steps: 10 });
            addLog('[DND Fallback] Mouse move to destination successful. Waiting 200ms.');
            await new Promise(resolve => setTimeout(resolve, 200));

            addLog('[DND Fallback] Performing mouse up at destination.');
            await mouseController.up();
            addLog('[DND Fallback] Mouse up successful. Waiting 500ms for drop to process.');
            await new Promise(resolve => setTimeout(resolve, 500)); 

            addLog('[DND Fallback] Performing a slight mouse wiggle after drop.');
            await mouseController.move(destinationBox.x + destinationBox.width / 2 + 1, destinationBox.y + destinationBox.height / 2 + 1, { steps: 2 });
            await new Promise(resolve => setTimeout(resolve, 100));

            addLog('[DND Fallback] Drag and drop with mouse events completed.');
          } catch (mouseError: any) {
            addLog(`[DND Fallback] Error during mouse event simulation: ${mouseError.message}`);
            throw mouseError; // Re-throw the error
          } finally {
            if (mouseDownSuccessful) {
              addLog('[DND Fallback] In finally block. Ensuring mouse is up.');
              try {
                await mouseController.up(); 
                addLog('[DND Fallback] Explicit mouse.up() in finally block executed.');
              } catch (releaseError: any) {
                addLog(`[DND Fallback] Error during explicit mouse.up() in finally: ${releaseError.message}.`);
              }
            }
          }
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Drag and drop fallback operation timed out after ${DRAG_AND_DROP_TIMEOUT / 1000} seconds.`)), DRAG_AND_DROP_TIMEOUT)
        )
      ]);
    } finally {
      addLog('[handleDragAndDrop] Re-enabling drag interception after fallback attempt.');
      await page.setDragInterception(true); // Re-enable after fallback
    }
  }

  // Log DOM state of source and destination after drag for debugging
  addLog('[handleDragAndDrop] Attempting to log post-drag DOM state...');
  try {
    const cleanDestinationSelector = extractHintedSelector(destinationSelectorOrText || '').selectorValue || destinationSelectorOrText;
    try {
      addLog('[handleDragAndDrop] Logging destination element DOM state (max 2s wait)...');
      const trashHTMLElement = await Promise.race([
        currentFrame.evaluate(selector => {
          const el = document.querySelector(selector);
          return el ? el.outerHTML : 'Trash element not found post-drag.';
        }, cleanDestinationSelector),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout logging destination DOM')), 2000))
      ]);
      addLog(`[handleDragAndDrop] #trash content after drag (selector: ${cleanDestinationSelector}): ${(trashHTMLElement as string).substring(0, 500)}...`);
    } catch (logDestError: any) {
      addLog(`[handleDragAndDrop] Error or timeout logging destination element's post-drag DOM state: ${logDestError.message}`);
    }

    const cleanSourceSelectorForGallery = (extractHintedSelector(sourceSelectorOrText || '').selectorValue || sourceSelectorOrText || '').replace(/ li:nth-child\(\d+\) img$/, '');
    try {
      addLog('[handleDragAndDrop] Logging source element DOM state (max 2s wait)...');
      const galleryHTMLElement = await Promise.race([
        currentFrame.evaluate(selector => {
          const el = document.querySelector(selector);
          return el ? el.outerHTML : 'Gallery element not found post-drag.';
        }, cleanSourceSelectorForGallery),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout logging source DOM')), 2000))
      ]);
      addLog(`[handleDragAndDrop] #gallery content after drag (selector: ${cleanSourceSelectorForGallery}): ${(galleryHTMLElement as string).substring(0, 500)}...`);
    } catch (logSourceError: any) {
      addLog(`[handleDragAndDrop] Error or timeout logging source element's post-drag DOM state: ${logSourceError.message}`);
    }

  } catch (logError) {
    // This catch block might be redundant now with individual catches, but kept for safety.
    addLog(`[handleDragAndDrop] General error logging post-drag DOM state: ${(logError as Error).message}`);
  }
  addLog('[handleDragAndDrop] Finished logging post-drag DOM state.');

  // Ensure elements are disposed
  if (sourceElement && !(sourceElement as any)._disposed) { // Check if not already disposed by successful native drag
    try { await sourceElement.dispose(); } catch (e) { addLog('Error disposing sourceElement: ' + (e as Error).message); }
  }
  if (destinationElement && !(destinationElement as any)._disposed) { // Check if not already disposed
    try { await destinationElement.dispose(); } catch (e) { addLog('Error disposing destinationElement: ' + (e as Error).message); }
  }
} 