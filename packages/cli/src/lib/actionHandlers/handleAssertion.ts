import { Page, Frame, ElementHandle } from 'puppeteer';
import { AddLogFunction, findElementWithFallbacks } from '../elementFinder'; // Adjust path as necessary
import { ParsedTestStep } from '../../lib/testTypes'; // Corrected import path

export async function handleAssertion(
  page: Page | null, // For URL assertions and passed to findElement
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  parsedStep: ParsedTestStep,
  overallTestCaseExpectedResult?: string
): Promise<void> {
  if (!currentFrame) throw new Error('Current frame not available for assertion');
  const executionContext = currentFrame;

  if (!parsedStep.assertion) {
      addLog('No structured assertion details found, falling back to legacy assertion logic with target: ' + parsedStep.target);
      if (!parsedStep.target) throw new Error('Legacy assertion target not provided');
      
      const pageContentForLegacy = await executionContext.content();
      if (pageContentForLegacy.includes(parsedStep.target)) {
          addLog(`Legacy assertion: Literal string "${parsedStep.target}" found on page. Assertion passed.`);
          return;
      }
      if (overallTestCaseExpectedResult && pageContentForLegacy.includes(overallTestCaseExpectedResult)) {
          addLog(`Legacy assertion: Overall expected text "${overallTestCaseExpectedResult}" found on page. Assertion passed.`);
          return;
      }
      throw new Error(`Legacy assertion failed: Could not find "${parsedStep.target}" ${overallTestCaseExpectedResult ? `or "${overallTestCaseExpectedResult}"` : ''} as literal text on the page.`);
  }

  const assertion = parsedStep.assertion;
  addLog(`Executing structured assertion: ${assertion.type} - ${assertion.condition}`);

  switch (assertion.type) {
    case 'url':
      if (!page) throw new Error('Page context not available for URL assertion.');
      if (!assertion.expectedText) throw new Error('Expected URL text not provided for URL assertion.');
      const currentUrl = page.url();
      addLog(`Current URL: ${currentUrl}, Expected: ${assertion.expectedText}, Condition: ${assertion.condition}`);
      if (assertion.condition === 'equals') {
        if (currentUrl !== assertion.expectedText) {
          throw new Error(`URL assertion failed: Expected "${assertion.expectedText}" but got "${currentUrl}"`);
        }
      } else if (assertion.condition === 'contains') {
        if (!currentUrl.includes(assertion.expectedText)) {
          throw new Error(`URL assertion failed: Expected URL to contain "${assertion.expectedText}" but got "${currentUrl}"`);
        }
      } else {
        throw new Error(`Unsupported condition "${assertion.condition}" for URL assertion.`);
      }
      addLog('URL assertion passed.');
      break;

    case 'elementText':
      if (!assertion.selector) throw new Error('Selector not provided for element text assertion.');
      if (assertion.expectedText === undefined) throw new Error('Expected text not provided for element text assertion.');
      
      addLog(`Asserting text for selector "${assertion.selector}". Expected: "${assertion.expectedText}", Condition: ${assertion.condition}`);
      const elementForText = await findElementWithFallbacks(page, currentFrame, addLog, assertion.selector, `element for text assertion (${assertion.selector})`, parsedStep.originalStep);
      const actualText = await elementForText.evaluate(el => el.textContent);
      await elementForText.dispose();
      addLog(`Actual text for "${assertion.selector}": "${actualText}"`);

      if (actualText === null || actualText === undefined) throw new Error(`Element "${assertion.selector}" found, but it has no text content.`);

      if (assertion.condition === 'equals') {
        if (actualText.trim() !== assertion.expectedText) {
          throw new Error(`Element text assertion failed for "${assertion.selector}": Expected "${assertion.expectedText}" but got "${actualText.trim()}"`);
        }
      } else if (assertion.condition === 'contains') {
        if (!actualText.includes(assertion.expectedText)) {
          throw new Error(`Element text assertion failed for "${assertion.selector}": Expected text to contain "${assertion.expectedText}" but got "${actualText}"`);
        }
      } else {
        throw new Error(`Unsupported condition "${assertion.condition}" for element text assertion.`);
      }
      addLog('Element text assertion passed.');
      break;

    case 'elementVisible':
      if (!assertion.selector) throw new Error('Selector not provided for element visibility assertion.');
      addLog(`Asserting visibility for selector "${assertion.selector}". Condition: ${assertion.condition}`);
      
      try {
          const elementForVisibility = await findElementWithFallbacks(page, currentFrame, addLog, assertion.selector, `element for visibility (${assertion.selector})`, parsedStep.originalStep);
          if (assertion.condition === 'isVisible') {
               addLog(`Element "${assertion.selector}" is visible as expected. Assertion passed.`);
               await elementForVisibility.dispose();
          } else {
              await elementForVisibility.dispose(); 
              throw new Error(`Unsupported visibility condition "${assertion.condition}". Only 'isVisible' is currently directly supported by this check.`);
          }
      } catch (error) {
          if (assertion.condition === 'isVisible') {
              addLog(`Element "${assertion.selector}" not found or not visible. Error: ${(error as Error).message}`);
              throw new Error(`Element visibility assertion failed for "${assertion.selector}": Expected to be visible, but was not found/visible. Original error: ${(error as Error).message}`);
          } else {
              throw error;
          }
      }
      break;

    case 'pageText':
      if (assertion.expectedText === undefined) throw new Error('Expected text not provided for page text assertion.');
      addLog(`Asserting page content within current context. Expected to contain: "${assertion.expectedText}", Condition: ${assertion.condition}`);
      const frameContent = await executionContext.content();
      if (assertion.condition === 'contains') {
        if (!frameContent.includes(assertion.expectedText)) {
          throw new Error(`Page text assertion failed: Expected current context to contain "${assertion.expectedText}" but it was not found.`);
        }
      } else {
        throw new Error(`Unsupported condition "${assertion.condition}" for page text assertion. Only 'contains' is supported.`);
      }
      addLog('Page text assertion passed.');
      break;

    case 'elementValue':
      if (!assertion.selector) throw new Error('Selector not provided for element value assertion.');
      if (assertion.expectedText === undefined) throw new Error('Expected value not provided for element value assertion.');
      
      addLog(`Asserting value for selector "${assertion.selector}". Expected: "${assertion.expectedText}", Condition: ${assertion.condition}`);
      const elementForValue = await findElementWithFallbacks(page, currentFrame, addLog, assertion.selector, `element for value assertion (${assertion.selector})`, parsedStep.originalStep);
      
      const actualValue = await elementForValue.evaluate(el => (el as HTMLInputElement).value);
      await elementForValue.dispose();
      addLog(`Actual value for "${assertion.selector}": "${actualValue}"`);

      if (actualValue === null || actualValue === undefined) {
        throw new Error(`Element "${assertion.selector}" found, but it has no value property or it is null/undefined.`);
      }

      if (assertion.condition === 'equals') {
        if (actualValue !== assertion.expectedText) {
          throw new Error(`Element value assertion failed for "${assertion.selector}": Expected "${assertion.expectedText}" but got "${actualValue}"`);
        }
      } else if (assertion.condition === 'contains') {
        if (!actualValue.includes(assertion.expectedText)) {
          throw new Error(`Element value assertion failed for "${assertion.selector}": Expected value to contain "${assertion.expectedText}" but got "${actualValue}"`);
        }
      } else {
        throw new Error(`Unsupported condition "${assertion.condition}" for element value assertion. Only 'equals' and 'contains' are supported.`);
      }
      addLog('Element value assertion passed.');
      break;

    default:
      const unknownType = (assertion as any).type;
      throw new Error(`Unsupported assertion type: "${unknownType}"`);
  }
} 