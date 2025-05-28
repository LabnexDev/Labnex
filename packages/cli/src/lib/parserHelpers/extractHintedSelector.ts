import { addLog } from './addLog';

// Returns the type ('xpath', 'css', etc.), the selector value, and the remaining part of the step.
export function extractHintedSelector(stepPart: string): { type?: string; selectorValue?: string; remainingStep: string } {
  addLog(`[extractHintedSelector] Received stepPart: "${stepPart}"`);
  // Regex to capture (type: value)
  // It's important that (.+) is greedy to capture selectors with internal colons if not part of type,
  // but also needs to handle cases where the value itself might be quoted.
  // For simplicity, we'll assume type is simple word characters, and value is everything else until the closing parenthesis.
  const hintPattern = /^\s*\(\s*(\w+)\s*:\s*(.+?)\s*\)\s*$/i; // Made .+ non-greedy
  const match = stepPart.match(hintPattern);

  if (match && match[1] && match[2]) {
      const type = match[1].toLowerCase();
      const selectorValue = match[2].trim(); // Trim the raw value
      addLog(`[extractHintedSelector] Hint found. Type: "${type}", Raw Value: "${selectorValue}"`);
      const remainingStep = stepPart.replace(hintPattern, '').trim();
      addLog(`[extractHintedSelector] Remaining step after hint extraction: "${remainingStep}"`);
      return { type, selectorValue, remainingStep };
  }
  addLog(`[extractHintedSelector] No hint pattern matched in: "${stepPart}"`);
  return { remainingStep: stepPart.trim() }; // No hint, return original step part as remaining.
} 