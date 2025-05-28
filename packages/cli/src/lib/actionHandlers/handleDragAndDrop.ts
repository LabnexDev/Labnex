import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary

export async function handleDragAndDrop(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  sourceSelectorOrText: string,
  destinationSelectorOrText: string | undefined,
  originalStep: string
): Promise<void> {
  if (!currentFrame) throw new Error('Current frame not available for drag and drop');
  if (!page) throw new Error('Page context not available for drag and drop');
  if (!sourceSelectorOrText) throw new Error('Source selector not provided for drag and drop');
  if (!destinationSelectorOrText) throw new Error('Destination selector not provided for drag and drop');

  // Check if currently in an iframe context
  const isInIframe = currentFrame !== page;
  if (isInIframe) {
    addLog('[handleDragAndDrop] Currently in an iframe. Starting a 7-second pause for content to load.');
    await new Promise(resolve => setTimeout(resolve, 7000));
    addLog('[handleDragAndDrop] 7-second iframe pause COMPLETED.');
  } else {
    addLog('[handleDragAndDrop] Not in an iframe. Proceeding directly.');
  }

  addLog('[handleDragAndDrop] Processing drag and drop action. Finding source element...');
  const sourceElement = await findElementWithFallbacks(page, currentFrame, addLog, sourceSelectorOrText, `source element (${sourceSelectorOrText})`, originalStep);
  addLog('[handleDragAndDrop] Source element found. Finding destination element...');
  
  if (!destinationSelectorOrText) {
    throw new Error('Destination selector not provided for drag and drop');
  }
  const destinationElement = await findElementWithFallbacks(page, currentFrame, addLog, destinationSelectorOrText, `destination element (${destinationSelectorOrText})`, originalStep);
  addLog('[handleDragAndDrop] Destination element found.');

  // ... rest of the drag and drop logic (Puppeteer's dragAndDrop, fallback, etc.)
  addLog(`Attempting drag from source to destination using Puppeteer's built-in dragAndDrop.`);
  try {
    await sourceElement.dragAndDrop(destinationElement);
    addLog('Drag and drop successful using native method.');
    await sourceElement.dispose();
    await destinationElement.dispose();
    return;
  } catch (error: any) {
    addLog(`Native dragAndDrop failed: ${error.message}. Attempting fallback mouse events.`);
  }

  // Fallback: Perform drag and drop using mouse events if the direct method fails or isn't available
  const sourceBox = await sourceElement.boundingBox();
  const destinationBox = await destinationElement.boundingBox();

  if (!sourceBox || !destinationBox) {
    await sourceElement.dispose();
    await destinationElement.dispose();
    throw new Error('Could not get bounding box for source or destination element for drag and drop fallback.');
  }

  addLog('Performing drag and drop using simulated mouse events.');
  // Determine the correct mouse controller
  const mouseController = isInIframe && currentFrame && 'mouse' in currentFrame ? currentFrame.mouse : page.mouse;

  await mouseController.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  await mouseController.down();
  // A small delay can sometimes help ensure the mousedown is registered before moving
  await new Promise(resolve => setTimeout(resolve, 200)); 
  await mouseController.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2, { steps: 5 }); // Added steps for smoother transition
  await new Promise(resolve => setTimeout(resolve, 200)); // Delay before mouse up
  await mouseController.up();

  addLog('Drag and drop with mouse events completed.');
  await sourceElement.dispose();
  await destinationElement.dispose();
} 