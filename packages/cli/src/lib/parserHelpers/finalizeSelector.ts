import { addLog } from './addLog';

// Helper to finalize a selector (e.g. add xpath/ prefix)
export function finalizeSelector(type?: string, selectorValue?: string): string | undefined {
  if (!selectorValue) return undefined;
  if (type === 'xpath') {
    // Ensure the prefix is "xpath:" and the selectorValue follows directly.
    // Puppeteer's page.waitForSelector handles "xpath://foo" or "xpath:(//foo)".
    // It does not need an extra slash if selectorValue already starts with / or (.
    if (selectorValue.startsWith('//') || selectorValue.startsWith('./') || selectorValue.startsWith('(')) {
      return `xpath:${selectorValue}`; 
    } else {
      // If selectorValue is something like "foo" for XPath, it should be "//foo" or similar.
      // Forcing a single slash might be incorrect if it's a relative path from context node.
      // However, user input for (xpath: foo) is ambiguous. Standard practice is (xpath: //foo).
      // We will assume the user provides a valid XPath starting point if not absolute.
      addLog(`[finalizeSelector] Warning: XPath value "${selectorValue}" does not start with //, ./, or (. Potential issue if not a relative path from specific context.`);
      return `xpath:${selectorValue}`; // e.g. results in xpath:foo - puppeteer might handle as xpath://foo or relative
    }
  }
  return selectorValue; // Assume CSS or other raw selector
} 