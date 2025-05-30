import { Page, Frame, ElementHandle } from 'puppeteer';
import { ElementFinder } from '../elementFinderV2';
import { AddLogFunction, RetryApiCallFunction } from '../elementFinderV2';

interface DragAndDropOptions {
  dragDelay?: number;
  dropDelay?: number;
  steps?: number;
  waitAfterDrop?: number;
}

export async function handleDragAndDropV2(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  sourceSelectorOrText: string,
  destinationSelectorOrText: string | undefined,
  originalStep: string,
  retryApiCallFn?: RetryApiCallFunction,
  options: DragAndDropOptions = {}
): Promise<void> {
  if (!currentFrame) throw new Error('Current frame not available for drag and drop');
  if (!page) throw new Error('Page context not available for drag and drop');
  if (!sourceSelectorOrText) throw new Error('Source selector not provided');
  if (!destinationSelectorOrText) throw new Error('Destination selector not provided');

  const {
    dragDelay = 300,
    dropDelay = 300,
    steps = 20,
    waitAfterDrop = 1000
  } = options;

  addLog('[DragAndDropV2] Starting enhanced drag and drop operation');

  // Initialize element finder
  const elementFinder = new ElementFinder(page, currentFrame, addLog, retryApiCallFn);

  // Find source element
  addLog(`[DragAndDropV2] Finding source: "${sourceSelectorOrText}"`);
  const sourceElement = await elementFinder.findElement({
    selector: sourceSelectorOrText,
    descriptiveTerm: `source element (${sourceSelectorOrText})`,
    originalStep
  }, {
    waitForVisible: true,
    waitForClickable: true,
    scrollIntoView: true
  });

  if (!sourceElement) {
    throw new Error(`Source element not found: ${sourceSelectorOrText}`);
  }

  // Find destination element
  addLog(`[DragAndDropV2] Finding destination: "${destinationSelectorOrText}"`);
  const destinationElement = await elementFinder.findElement({
    selector: destinationSelectorOrText,
    descriptiveTerm: `destination element (${destinationSelectorOrText})`,
    originalStep
  }, {
    waitForVisible: true,
    scrollIntoView: true
  });

  if (!destinationElement) {
    await sourceElement.dispose();
    throw new Error(`Destination element not found: ${destinationSelectorOrText}`);
  }

  try {
    // Get element positions
    const sourceBox = await sourceElement.boundingBox();
    const destBox = await destinationElement.boundingBox();

    if (!sourceBox || !destBox) {
      throw new Error('Could not get bounding boxes for elements');
    }

    addLog('[DragAndDropV2] Element positions:', {
      source: { x: sourceBox.x, y: sourceBox.y, width: sourceBox.width, height: sourceBox.height },
      destination: { x: destBox.x, y: destBox.y, width: destBox.width, height: destBox.height }
    });

    // Calculate center points
    const sourceCenter = {
      x: sourceBox.x + sourceBox.width / 2,
      y: sourceBox.y + sourceBox.height / 2
    };

    const destCenter = {
      x: destBox.x + destBox.width / 2,
      y: destBox.y + destBox.height / 2
    };

    // Try native drag and drop first
    addLog('[DragAndDropV2] Attempting native dragAndDrop');
    let nativeSuccess = false;
    
    try {
      await sourceElement.dragAndDrop(destinationElement);
      nativeSuccess = true;
      addLog('[DragAndDropV2] Native dragAndDrop completed');
    } catch (error: any) {
      addLog(`[DragAndDropV2] Native dragAndDrop failed: ${error.message}`);
    }

    // If native failed or we're on a problematic site, use manual simulation
    if (!nativeSuccess || page.url().includes('globalsqa.com')) {
      addLog('[DragAndDropV2] Using manual mouse event simulation');
      
      // Reset mouse state
      await page.mouse.reset();
      
      // Disable drag interception for manual control
      await page.setDragInterception(false);

      // Hover over source to trigger any hover effects
      await sourceElement.hover();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Move to source center
      await page.mouse.move(sourceCenter.x, sourceCenter.y, { steps: 5 });
      await new Promise(resolve => setTimeout(resolve, 100));

      // Mouse down on source
      await page.mouse.down();
      addLog('[DragAndDropV2] Mouse down on source');
      await new Promise(resolve => setTimeout(resolve, dragDelay));

      // Generate smooth path from source to destination
      const path = generateSmoothPath(sourceCenter, destCenter, steps);
      
      // Move along path
      for (let i = 0; i < path.length; i++) {
        await page.mouse.move(path[i].x, path[i].y, { steps: 1 });
        if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
      
      addLog('[DragAndDropV2] Moved to destination');
      await new Promise(resolve => setTimeout(resolve, dropDelay));

      // Mouse up at destination
      await page.mouse.up();
      addLog('[DragAndDropV2] Mouse up at destination');

      // Small wiggle to ensure drop registers
      await page.mouse.move(destCenter.x + 2, destCenter.y + 2, { steps: 2 });
      await page.mouse.move(destCenter.x, destCenter.y, { steps: 2 });

      // Re-enable drag interception
      await page.setDragInterception(true);
    }

    // Wait for drop to complete
    await new Promise(resolve => setTimeout(resolve, waitAfterDrop));

    // Verify drop success by checking DOM state
    const dropSuccess = await verifyDropSuccess(
      currentFrame,
      sourceElement,
      destinationElement,
      addLog
    );

    if (dropSuccess) {
      addLog('[DragAndDropV2] ✓ Drag and drop completed successfully');
    } else {
      addLog('[DragAndDropV2] ⚠ Drag and drop completed but verification uncertain');
    }

  } finally {
    // Clean up
    try { await sourceElement.dispose(); } catch (e) { }
    try { await destinationElement.dispose(); } catch (e) { }
  }
}

// Generate smooth curved path for drag
function generateSmoothPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  steps: number
): Array<{ x: number; y: number }> {
  const path = [];
  
  // Add slight curve to make movement more natural
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const curveAmount = 20;
  const curveX = midX + (Math.random() - 0.5) * curveAmount;
  const curveY = midY + (Math.random() - 0.5) * curveAmount;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    // Quadratic Bezier curve
    const x = mt2 * start.x + 2 * mt * t * curveX + t2 * end.x;
    const y = mt2 * start.y + 2 * mt * t * curveY + t2 * end.y;

    path.push({ x, y });
  }

  return path;
}

// Verify that the drop was successful
async function verifyDropSuccess(
  frame: Page | Frame,
  sourceElement: ElementHandle,
  destinationElement: ElementHandle,
  addLog: AddLogFunction
): Promise<boolean> {
  try {
    // Check if source element has moved or changed parent
    const sourceParentChanged = await sourceElement.evaluate(el => {
      const originalParent = el.parentElement;
      return originalParent === null || originalParent !== el.parentElement;
    }).catch(() => true); // If element is gone, consider it moved

    // Check if destination has new children
    const destChildrenChanged = await destinationElement.evaluate(el => {
      const childCount = el.children.length;
      // Store original count in dataset for comparison
      const htmlEl = el as HTMLElement;
      const originalCount = parseInt(htmlEl.dataset.originalChildCount || '0');
      if (!htmlEl.dataset.originalChildCount) {
        htmlEl.dataset.originalChildCount = childCount.toString();
      }
      return childCount > originalCount;
    }).catch(() => false);

    // Check for common drag-and-drop class changes
    const classesChanged = await frame.evaluate(() => {
      const draggedElements = document.querySelectorAll('.dragged, .dropped, [data-dragged="true"]');
      return draggedElements.length > 0;
    }).catch(() => false);

    const success = sourceParentChanged || destChildrenChanged || classesChanged;
    
    addLog(`[DragAndDropV2] Verification: sourceParentChanged=${sourceParentChanged}, destChildrenChanged=${destChildrenChanged}, classesChanged=${classesChanged}`);
    
    return success;
  } catch (error: any) {
    addLog(`[DragAndDropV2] Error verifying drop success: ${error.message}`);
    return false;
  }
} 