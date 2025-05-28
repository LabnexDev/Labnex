import { addLog } from './addLog';
import { ParsedTestStep } from '../testTypes';

export function extractDialogExpectation(step: string): { expectation?: ParsedTestStep['expectsDialog'], remainingStep: string } {
  const dialogHandlingPattern = /\s+and\s+(accept|dismiss)\s+(alert|confirm|confirmation|prompt)(?:\s+with\s+(['"])(.*?)\3)?$/i;
  const dialogMatch = step.match(dialogHandlingPattern);
  
  if (dialogMatch) {
      addLog(`Dialog pattern matched: ${dialogMatch[0]}`);
      const dialogAction = dialogMatch[1].toLowerCase() as 'accept' | 'dismiss';
      let dialogType = dialogMatch[2].toLowerCase();
      if (dialogType === 'confirmation') dialogType = 'confirm';
      const promptText = dialogMatch[4]; // Captured text for prompt

      const expectation: ParsedTestStep['expectsDialog'] = {
          type: dialogType as 'alert' | 'confirm' | 'prompt',
          action: dialogAction,
      };
      if (dialogType === 'prompt' && dialogAction === 'accept' && promptText !== undefined) {
          expectation.promptText = promptText;
      }
      
      const remainingStep = step.substring(0, step.length - dialogMatch[0].length).trim();
      addLog(`Step after removing dialog phrase: "${remainingStep}"`);
      return { expectation, remainingStep };
  }
  addLog("No dialog handling phrase found in step.");
  return { remainingStep: step };
} 