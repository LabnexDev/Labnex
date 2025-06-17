import { Page, Frame, ElementHandle } from 'puppeteer';
import { findElementWithFallbacks, AddLogFunction, RetryApiCallFunction } from '../elementFinderV2';
import { ParsedTestStep } from '../testTypes';

export async function handleAssertion(
  page: Page | null,
  currentFrame: Page | Frame | null,
  addLog: AddLogFunction,
  parsedStep: ParsedTestStep,
  overallTestCaseExpectedResult?: string, // Kept for potential future use with a more complex assertion
  retryApiCallFn?: RetryApiCallFunction
): Promise<void> {
  if (!page || !currentFrame) {
    throw new Error('Page or frame not initialized for assertion.');
  }

  const assertionType = parsedStep.assertion?.type || parsedStep.assertionType; // Prefer new assertion structure
  const selector = parsedStep.assertion?.selector || parsedStep.target;
  const expectedText = parsedStep.assertion?.expectedText || parsedStep.expectedText; // Prefer new
  const condition = parsedStep.assertion?.condition; // From new structure

  if (!assertionType) {
    throw new Error('Assertion type not provided in parsed step.');
  }

  addLog(`Starting assertion: Type="${assertionType}", Selector="${selector || 'N/A'}", Expected="${expectedText || 'N/A'}", Condition="${condition || 'N/A'}"`);

  let element: ElementHandle | null = null;

  try {
    if (assertionType === 'url') {
      const actualUrl = page.url();
      if (condition === 'contains') {
        if (!actualUrl.includes(expectedText || '')) {
          throw new Error(`Assertion Failed: URL "${actualUrl}" does not contain "${expectedText}".`);
        }
      } else { // Default to equals for URL
        if (actualUrl !== (expectedText || '')) {
          throw new Error(`Assertion Failed: URL is "${actualUrl}", expected "${expectedText}".`);
        }
      }
      addLog(`Assertion Passed: URL is "${actualUrl}".`);
      return;
    }

    if (assertionType === 'pageText') {
      const bodyText = await page.evaluate(() => document.body.innerText);
      if (!bodyText.toLowerCase().includes((expectedText || '').toLowerCase())) {
        throw new Error(`Assertion Failed: Did not find text "${expectedText}" in page content.`);
      }
      addLog(`Assertion Passed: Found text "${expectedText}" in page content.`);
      return;
    }

    // For assertion types that operate on a specific element we must have a selector.
    const elementRequiredTypes = ['elementText', 'elementVisible', 'elementValue'];
    if (elementRequiredTypes.includes(assertionType) && !selector) {
      throw new Error(`Selector not provided for assertion type: ${assertionType}`);
    }

    if (selector) {
      element = await findElementWithFallbacks(page, currentFrame, addLog, selector, selector, parsedStep.originalStep || '', false, retryApiCallFn);
    }

    if (!element) {
      throw new Error(`Element not found for selector: ${selector}`);
    }

    if (assertionType === 'elementText') {
      const actualText = await element.evaluate(el => el.textContent);
      const normalizedActual = (actualText || '').trim().toLowerCase();
      const normalizedExpected = (expectedText || '').trim().toLowerCase();

      if (condition === 'contains') {
        if (!normalizedActual.includes(normalizedExpected)) {
          throw new Error(`Assertion Failed: Element text "${actualText}" does not contain "${expectedText}".`);
        }
      } else { // Default to equals for elementText
        if (normalizedActual !== normalizedExpected) {
          throw new Error(`Assertion Failed: Element text is "${actualText}", expected "${expectedText}".`);
        }
      }
      addLog(`Assertion Passed: Element text is "${actualText}".`);
    } else if (assertionType === 'elementVisible' || parsedStep.assertionType === 'visible' || parsedStep.assertionType === 'present') {
      // 'present' is covered by findElementWithFallbacks not throwing an error.
      // For 'visible', we check isIntersectingViewport.
      const isVisible = await element.isIntersectingViewport();
      if (condition === 'isVisible') { // From new assertion structure
         if (!isVisible && (expectedText?.toLowerCase() === 'true' || expectedText === undefined)){ // visible === true by default
            throw new Error(`Assertion Failed: Element "${selector}" is not visible as expected.`);
         }
         if (isVisible && expectedText?.toLowerCase() === 'false'){
            throw new Error(`Assertion Failed: Element "${selector}" is visible, but expected to be hidden.`);
         }
      } else { // Fallback to old logic if condition is not 'isVisible'
          if (!isVisible && (parsedStep.assertionType === 'visible' || expectedText?.toLowerCase() !== 'false')) { // visible === true by default
            throw new Error(`Assertion Failed: Element "${selector}" is not visible.`);
          }
           if (isVisible && expectedText?.toLowerCase() === 'false'){ // explicit assertion for not visible
            throw new Error(`Assertion Failed: Element "${selector}" is visible, but expected to be hidden.`);
         }
      }
      addLog(`Assertion Passed: Element "${selector}" visibility/presence is as expected.`);
    } else if (assertionType === 'elementValue') {
        const actualValue = await element.evaluate((el: any) => el.value);
        const normalizedActual = (actualValue || '').trim().toLowerCase();
        const normalizedExpected = (expectedText || '').trim().toLowerCase();
         if (condition === 'contains') {
            if (!normalizedActual.includes(normalizedExpected)) {
              throw new Error(`Assertion Failed: Element value "${actualValue}" does not contain "${expectedText}".`);
            }
        } else { // Default to equals for elementValue
            if (normalizedActual !== normalizedExpected) {
              throw new Error(`Assertion Failed: Element value is "${actualValue}", expected "${expectedText}".`);
            }
        }
        addLog(`Assertion Passed: Element value is "${actualValue}".`);
    } else if (parsedStep.assertionType === 'enabled') { // Old types
      const isDisabled = await element.evaluate(el => (el as HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement).disabled);
      if (isDisabled) {
        throw new Error(`Assertion Failed: Element "${selector}" is not enabled.`);
      }
      addLog(`Assertion Passed: Element "${selector}" is enabled.`);
    } else if (parsedStep.assertionType === 'disabled') { // Old types
      const isDisabled = await element.evaluate(el => (el as HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement).disabled);
      if (!isDisabled) {
        throw new Error(`Assertion Failed: Element "${selector}" is not disabled.`);
      }
      addLog(`Assertion Passed: Element "${selector}" is disabled.`);
    } else {
      // Check for overall test case expectation as a fallback if no other assertion matched
      if (overallTestCaseExpectedResult) {
        const bodyText = await page.evaluate(() => document.body.innerText);
        if (bodyText.toLowerCase().includes(overallTestCaseExpectedResult.toLowerCase())) {
          addLog(`Assertion Passed (Overall): Found overall expected result "${overallTestCaseExpectedResult}" in page content.`);
          return;
        } else {
          throw new Error(`Assertion Failed (Overall): Did not find overall expected result "${overallTestCaseExpectedResult}" in page content. Also, specific assertion type "${assertionType}" was not handled.`);
        }
      }
      throw new Error(`Unsupported or incomplete assertion type: ${assertionType} for step: ${parsedStep.originalStep}`);
    }
  } finally {
    if (element) {
      await element.dispose();
    }
  }
} 