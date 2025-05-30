import { addLog } from './addLog';

// Returns the type ('xpath', 'css', etc.), the selector value, and the remaining part of the step.
export function extractHintedSelector(stepPart: string): { type?: string; selectorValue?: string; remainingStep: string } {
  addLog(`[extractHintedSelector] Received stepPart: "${stepPart}"`);
  
  // First, check for xpath:// or css:// prefix format
  const prefixPattern = /^(xpath|css):\/\/(.+)$/i;
  const prefixMatch = stepPart.match(prefixPattern);
  
  if (prefixMatch && prefixMatch[1] && prefixMatch[2]) {
    const type = prefixMatch[1].toLowerCase();
    const selectorValue = prefixMatch[2].trim();
    addLog(`[extractHintedSelector] Prefix hint found. Type: "${type}", Raw Value: "${selectorValue}"`);
    return { type, selectorValue, remainingStep: '' };
  }
  
  // Then check for (type: value) format
  const hintPattern = /^\s*\(\s*(\w+)\s*:\s*(.+?)\s*\)\s*$/i;
  const match = stepPart.match(hintPattern);

  if (match && match[1] && match[2]) {
      const type = match[1].toLowerCase();
      const selectorValue = match[2].trim();
      addLog(`[extractHintedSelector] Parentheses hint found. Type: "${type}", Raw Value: "${selectorValue}"`);
      const remainingStep = stepPart.replace(hintPattern, '').trim();
      addLog(`[extractHintedSelector] Remaining step after hint extraction: "${remainingStep}"`);
      return { type, selectorValue, remainingStep };
  }
  
  addLog(`[extractHintedSelector] No hint pattern matched in: "${stepPart}"`);
  return { remainingStep: stepPart.trim() };
} 