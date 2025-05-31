import { AssertionDetails, ParsedTestStep } from './lib/testTypes';
import {
  addLog,
  extractDialogExpectation,
  extractDropdownField,
  extractGeneralSelector,
  extractHintedSelector,
  extractInputField,
  extractQuotedText,
  extractScrollTarget,
  extractTimeout,
  extractUrl,
  extractValue,
  finalizeSelector,
  matchesPattern
} from './lib/parserHelpers';

export class TestStepParser {
  
  private static _tryParseWaitAction(normalizedStep: string, originalStep: string): ParsedTestStep | null {
    const waitPatternSimple = /^(?:wait|pause)(?:\s+for)?\s+(\d+)\s*(seconds?|s)?/i;
    const waitMatchSimple = normalizedStep.match(waitPatternSimple);
    addLog(`[WaitCheck] Input: "${normalizedStep}", Match: ${JSON.stringify(waitMatchSimple)}`);

    if (waitMatchSimple && waitMatchSimple[1]) {
        const timeoutValue = parseInt(waitMatchSimple[1], 10);
        const unit = waitMatchSimple[2]?.toLowerCase();
        let timeoutMs = timeoutValue;

        if (unit === 's' || unit === 'seconds' || !unit) { // Default to seconds if no unit or s/seconds
            timeoutMs = timeoutValue * 1000;
        }
        addLog(`[WaitBlockEntered] Parsed timeout: ${timeoutMs}ms. Returning 'wait' action.`);
        return {
            action: 'wait',
            timeout: timeoutMs,
            originalStep: originalStep,
        };
    }
    addLog(`[WaitBlockSkipped] Condition (waitMatchSimple && waitMatchSimple[1]) was false.`);
    return null;
  }

  private static _tryParseIframeSwitch(currentStep: string, normalizedCurrentStep: string, originalStepInput: string): ParsedTestStep | null {
    addLog(`[DEBUG_IFRAME_SWITCH] Entered _tryParseIframeSwitch. currentStep: "${currentStep}", normalized: "${normalizedCurrentStep}"`); // DEBUG LOG
    // --- Iframe and Context Switching Logic ---
    const switchToIframePattern = /(?:switch to|enter|focus on) iframe\s+(.+)/i;
    const iframeMatch = currentStep.match(switchToIframePattern);
    addLog(`[DEBUG_IFRAME_SWITCH] iframeMatch result: ${JSON.stringify(iframeMatch)}`); // DEBUG LOG

    if (iframeMatch && iframeMatch[1]) {
      const rawArg = iframeMatch[1].trim();
      addLog(`[DEBUG_IFRAME_SWITCH] rawArg from iframeMatch[1]: "${rawArg}"`); // DEBUG LOG
      let finalIframeSelector: string | undefined;

      let hintParseResult = extractHintedSelector(rawArg);
      if (hintParseResult.selectorValue) {
        finalIframeSelector = finalizeSelector(hintParseResult.type, hintParseResult.selectorValue);
        addLog(`[switchToIframe] Parsed as direct hint. Type: ${hintParseResult.type}, Final Selector: "${finalIframeSelector}"`);
      } else {
        const unquotedArg = extractQuotedText(rawArg);
        if (unquotedArg !== undefined) {
          addLog(`[switchToIframe] Raw argument not a direct hint. Unquoted to: "${unquotedArg}"`);
          hintParseResult = extractHintedSelector(unquotedArg);
          if (hintParseResult.selectorValue) {
            finalIframeSelector = finalizeSelector(hintParseResult.type, hintParseResult.selectorValue);
            addLog(`[switchToIframe] Parsed unquoted as hint. Type: ${hintParseResult.type}, Final Selector: "${finalIframeSelector}"`);
          } else {
            finalIframeSelector = unquotedArg; // Use unquoted value directly
            addLog(`[switchToIframe] Unquoted not a hint. Using as raw selector: "${finalIframeSelector}"`);
          }
        } else {
          finalIframeSelector = rawArg; // Use raw argument directly
          addLog(`[switchToIframe] Not a hint, not quoted. Using as raw selector: "${finalIframeSelector}"`);
        }
      }
      
      addLog(`[ParseSuccess] Action: switchToIframe, Target: ${finalIframeSelector}`);
      return {
        action: 'switchToIframe',
        target: finalIframeSelector,
        originalStep: originalStepInput
      };
    }

    const switchToMainContentPattern = /(?:switch to|return to|exit to|focus on) (?:main|default|top|parent) (?:content|document|page|frame)/i;
    if (switchToMainContentPattern.test(normalizedCurrentStep)) {
      addLog(`[ParseSuccess] Action: switchToMainContent`);
      return {
        action: 'switchToMainContent',
        originalStep: originalStepInput
      };
    }
    // --- End Iframe Logic ---
    return null;
  }

  private static _tryParseUploadAction(currentStep: string, originalStepInput: string): ParsedTestStep | null {
    // Pattern: "upload <filePath> to [element] <selector>"
    // filePath can be quoted or not. Selector can be quoted, hinted, or raw.
    const uploadPattern = /(?:upload|attach file|set file)\s+(.+?)\s+(?:to|on|into)(?:\s+element)?\s+(.+)/i;
    const uploadMatch = currentStep.match(uploadPattern);

    if (uploadMatch && uploadMatch[1] && uploadMatch[2]) {
      let filePathValue = extractQuotedText(uploadMatch[1].trim()) || uploadMatch[1].trim();
      if (filePathValue === '""' || filePathValue === "''") filePathValue = ""; // Handle empty quoted string

      let targetDescription = uploadMatch[2].trim(); // This is everything after "to [element] "
      addLog(`[UploadParser] Initial targetDescription: "${targetDescription}"`);

      // Try to unquote first, as hint might be inside quotes like "(xpath: //foo)"
      const unquotedTargetDesc = extractQuotedText(targetDescription);
      if (unquotedTargetDesc !== undefined) {
        addLog(`[UploadParser] Unquoted targetDescription: "${unquotedTargetDesc}"`);
        targetDescription = unquotedTargetDesc; 
      }

      let finalUploadSelector: string | undefined;
      const hintResult = extractHintedSelector(targetDescription); // Try hint on potentially unquoted description
      addLog(`[UploadParser] Hint result for "${targetDescription}": Type=${hintResult.type}, Value=${hintResult.selectorValue}`);

      if (hintResult.type && hintResult.selectorValue) {
        finalUploadSelector = finalizeSelector(hintResult.type, hintResult.selectorValue);
        addLog(`[UploadParser] Final selector from hint: "${finalUploadSelector}"`);
      } else {
        // If no hint, or hint parsing failed, use the (possibly unquoted) targetDescription as is
        // This covers cases like "upload file to #myInputId" or "upload file to myInputField"
        finalUploadSelector = targetDescription; 
        addLog(`[UploadParser] No valid hint, using targetDescription as selector: "${finalUploadSelector}"`);
      }
      
      if (!finalUploadSelector) {
        addLog(`[UploadParser] Could not determine target selector from "${uploadMatch[2].trim()}". Failing parse for upload.`);
        return null;
      }

      addLog(`[ParseSuccess] Action: upload, FilePath: "${filePathValue}", Target: "${finalUploadSelector}"`);
      return {
        action: 'upload',
        filePath: filePathValue,
        target: finalUploadSelector,
        originalStep: originalStepInput
      };
    }
    return null;
  }

  private static _tryParseDragAndDropAction(currentStep: string, originalStepInput: string): ParsedTestStep | null {
    addLog(`[DEBUG_DND] Entered _tryParseDragAndDropAction. currentStep: "${currentStep}"`); // DEBUG LOG
    const dragAndDropPattern = /(?:drag|move)\s+(.+?)\s+to\s+(.+)/i;
    const dndMatch = currentStep.match(dragAndDropPattern);
    addLog(`[DEBUG_DND] dndMatch result: ${JSON.stringify(dndMatch)}`); // DEBUG LOG

    if (dndMatch && dndMatch[1] && dndMatch[2]) {
      const sourceRaw = dndMatch[1].trim();
      const destinationRaw = dndMatch[2].trim();
      addLog(`[DEBUG_DND] sourceRaw: "${sourceRaw}", destinationRaw: "${destinationRaw}"`); // DEBUG LOG

      const sourceHintResult = extractHintedSelector(sourceRaw);
      addLog(`[DEBUG_DND] sourceHintResult: ${JSON.stringify(sourceHintResult)}`); // DEBUG LOG
      const sourceSelector = sourceHintResult.selectorValue
        ? finalizeSelector(sourceHintResult.type, sourceHintResult.selectorValue)
        : extractQuotedText(sourceRaw) ?? sourceRaw;

      const destinationHintResult = extractHintedSelector(destinationRaw);
      addLog(`[DEBUG_DND] destinationHintResult: ${JSON.stringify(destinationHintResult)}`); // DEBUG LOG
      const destinationSelector = destinationHintResult.selectorValue
        ? finalizeSelector(destinationHintResult.type, destinationHintResult.selectorValue)
        : extractQuotedText(destinationRaw) ?? destinationRaw;
      
      addLog(`[DEBUG_DND] Final sourceSelector: "${sourceSelector}", Final destinationSelector: "${destinationSelector}"`); // DEBUG LOG
      return {
        action: 'dragAndDrop',
        target: sourceSelector,
        destinationTarget: destinationSelector,
        originalStep: originalStepInput
      };
    }
    addLog(`[DEBUG_DND] Pattern did not match or not enough groups.`); // DEBUG LOG
    return null;
  }

  private static _tryParseAssertions(currentStep: string, originalStepInput: string): ParsedTestStep | null {
    // Parse Assertions - This block will handle various assertion syntaxes
    const assertUrlPattern = /^(?:assert|verify|check|expect)(?: that)? current url (is|equals|contains) (['\"])(.*?)\2/i;
    const urlAssertMatch = currentStep.match(assertUrlPattern);
    if (urlAssertMatch) {
        addLog(`[AssertURL] Matched: "${urlAssertMatch[0]}"`);
        let capturedCondition = urlAssertMatch[1].toLowerCase();
        const finalCondition = (capturedCondition === 'is' ? 'equals' : capturedCondition) as AssertionDetails['condition'];
        const expectedText = urlAssertMatch[3];
        return {
            action: 'assert',
            originalStep: originalStepInput,
            assertion: {
                type: 'url',
                condition: finalCondition, 
                expectedText: expectedText
            }
        };
    }

    // New pattern for structured assertions like: assert "(type=elementVisible, selector=css: #id, expected=value, condition=isVisible)"
    const structuredAssertPattern = /^(?:assert|verify|check|expect)\s+(['\"])(\s*type\s*=\s*([^,]+?)\s*,\s*selector\s*=\s*([^,]+?)\s*,\s*expected\s*=\s*([^,]*?)\s*,\s*condition\s*=\s*([^,]+?)\s*)\1/i;
    const structuredAssertMatch = currentStep.match(structuredAssertPattern);

    if (structuredAssertMatch && structuredAssertMatch[2]) {
        addLog(`[StructuredAssert] Matched: "${structuredAssertMatch[0]}"`);
        // Full matched group is structuredAssertMatch[2]
        // individual parts: type=structuredAssertMatch[3], selector=structuredAssertMatch[4], expected=structuredAssertMatch[5], condition=structuredAssertMatch[6]
        
        const assertType = structuredAssertMatch[3].trim() as AssertionDetails['type'];
        const selector = structuredAssertMatch[4].trim();
        const expectedText = structuredAssertMatch[5].trim() === 'N/A' ? undefined : structuredAssertMatch[5].trim();
        const condition = structuredAssertMatch[6].trim() as AssertionDetails['condition'];

        // Basic validation
        if (!assertType || !selector || !condition) {
            addLog(`[StructuredAssert] Failed to parse essential parts from: "${structuredAssertMatch[2]}"`);
            return null;
        }
        
        addLog(`[StructuredAssert] Parsed - Type: ${assertType}, Selector: ${selector}, Expected: ${expectedText}, Condition: ${condition}`);

        return {
            action: 'assert',
            originalStep: originalStepInput,
            assertion: {
                type: assertType,
                selector: selector,
                expectedText: expectedText,
                condition: condition
            }
        };
    }

    const generalAssertionPattern =
        /^(?:assert|verify|check|expect)(?: that)?\s+(?:(page)|(element|selector)\s+((?:\\(.+?\\)|[^\\s\'\"])+|\'[^\']+\'|\"[^\"]+\")(?:\s+(text))?\s+(is visible|is hidden|is not visible|exists|does not exist|is|equals|contains)(?:\s+([\'\"])(.*?)\7)?)$/i;

    const assertionMatch = currentStep.match(generalAssertionPattern);
    addLog(`[AssertGeneralElement] Attempting to match: "${currentStep}"`);
    addLog(`[AssertGeneralElement] Match result: ${JSON.stringify(assertionMatch)}`);

    if (assertionMatch) {
        // Based on logged Match result: [ M0, M1, M2, M3, M4, M5, M6, M7, M8 ]
        // M1: (page) group
        // M2: (element|selector) group text ("element" or "selector")
        // M3: (selector value) group
        // M4: (text) keyword group
        // M6: (condition: "is visible", etc.) group
        // M7: (quote char) group for expected text
        // M8: (expected text) group
        let assertionType: AssertionDetails['type'] = 'elementVisible';
        let condition: AssertionDetails['condition'] = 'isVisible';
        let expectedText: string | undefined;
        let selector: string | undefined;

        if (assertionMatch[1]) { // page
            assertionType = 'pageText';
            condition = assertionMatch[6].toLowerCase() === 'contains' ? 'contains' : 'equals';
            expectedText = assertionMatch[8];
        } else if (assertionMatch[2]) { // element or selector
            selector = assertionMatch[3];
            // Clean up selector if quoted
            selector = extractQuotedText(selector) ?? selector;
            addLog(`[AssertGeneralElement] Extracted selector: "${selector}"`);

            if (assertionMatch[5]) { // text keyword present
                assertionType = 'elementText';
                condition = assertionMatch[6].toLowerCase() === 'contains' ? 'contains' : 'equals';
                expectedText = assertionMatch[8];
            } else {
                const conditionText = assertionMatch[6].toLowerCase();
                if (conditionText === 'is visible') {
                    assertionType = 'elementVisible';
                    condition = 'isVisible';
                    expectedText = 'true';
                } else if (conditionText === 'is hidden' || conditionText === 'is not visible') {
                    assertionType = 'elementVisible';
                    condition = 'isVisible';
                    expectedText = 'false';
                } else if (conditionText === 'exists' || conditionText === 'does not exist') {
                    assertionType = 'elementVisible';
                    condition = 'isVisible';
                    expectedText = conditionText === 'exists' ? 'true' : 'false';
                } else {
                    assertionType = 'elementVisible';
                    condition = 'isVisible';
                    expectedText = 'true'; // default
                }
            }
        }

        return {
            action: 'assert',
            originalStep: originalStepInput,
            assertion: {
                type: assertionType,
                selector: selector,
                expectedText: expectedText,
                condition: condition
            }
        };
    }
    return null;
  }

  private static _tryParseExecuteScriptAction(normalizedStep: string, originalStepInput: string): ParsedTestStep | null {
    const executeScriptPattern = /execute javascript in frame\s+(.+?)\s+with script\s+(.+?)(?:\s+(and expect (alert|confirm|prompt)(?: with text ['"](.*?)['"])? then (accept|dismiss)))?$/i;
    const match = originalStepInput.match(executeScriptPattern);

    if (match && match[1] && match[2]) {
      let frameSelector = match[1].trim();
      let script = match[2].trim();
      
      const dialogKeywordOuter = match[3]; // Full "and expect...then..." string if present
      const matchedDialogType = match[4];    // Captured type: "alert", "confirm", or "prompt"
      const matchedPromptText = match[5];    // Captured prompt text
      const matchedDialogAction = match[6];  // Captured action: "accept" or "dismiss"

      frameSelector = extractQuotedText(frameSelector) || frameSelector;
      script = extractQuotedText(script) || script;
      
      if (!frameSelector || !script) {
        addLog('[ParseWarning] ExecuteScript: Frame selector or script is empty after trim/unquote.');
        return null;
      }

      if (!/^\((css|xpath):\s*.+\)$/i.test(frameSelector)) {
        addLog(`[ParseWarning] ExecuteScript: Frame selector "${frameSelector}" is not in the expected (type: value) format.`);
      }
      
      let dialogExpectation: ParsedTestStep['expectsDialog'] = undefined;
      if (dialogKeywordOuter && matchedDialogType && matchedDialogAction) {
        const type = matchedDialogType.toLowerCase();
        const action = matchedDialogAction.toLowerCase();

        if ((type === 'alert' || type === 'confirm' || type === 'prompt') && 
            (action === 'accept' || action === 'dismiss')) {
          dialogExpectation = {
            type: type as 'alert' | 'confirm' | 'prompt',
            response: action === 'accept' ? true : false,
          };
          if (type === 'prompt' && action === 'accept' && matchedPromptText) {
            dialogExpectation.response = matchedPromptText;
          }
          addLog(`[ExecuteScript] Directly parsed dialog expectation: ${JSON.stringify(dialogExpectation)}`);
        } else {
          addLog(`[ExecuteScript] Parsed dialog type/action ("${type}", "${action}") are not valid.`);
        }
      } else if (dialogKeywordOuter) {
        addLog(`[ExecuteScript] Potential dialog phrase "${dialogKeywordOuter}" was incomplete or not recognized by the refined regex.`);
      }
      
      addLog(`[ParseSuccess] Action: executeScript, FrameSelector: "${frameSelector}", Script: "${script.substring(0, 100)}${script.length > 100 ? '...' : ''}", Dialog: ${dialogExpectation ? 'Yes' : 'No'}`);
      return {
        action: 'executeScript',
        target: frameSelector,
        value: script,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation,
      };
    }
    return null;
  }

  private static _tryParseTypeAction(currentStep: string, originalStepInput: string): ParsedTestStep | null {
    // Pattern for AI-suggested type action: type (css: #selector) with value "text"
    const typePattern = /type\s+\(([^)]+)\)\s+with\s+value\s+(['"])(.*?)\2/i;
    const typeMatch = currentStep.match(typePattern);
    
    if (typeMatch && typeMatch[1] && typeMatch[3]) {
      const selector = typeMatch[1].trim();
      const value = typeMatch[3];
      addLog(`[TypeParser] Matched AI-suggested type action. Selector: ${selector}, Value: ${value}`);
      return {
        action: 'type',
        target: selector,
        value: value,
        originalStep: originalStepInput
      };
    }
    return null;
  }

  private static _parseStandardActionsAndFallbacks(
    currentStep: string, 
    normalizedCurrentStep: string, 
    originalStepInput: string,
    mainHintedSelectorType: string | undefined,
    mainHintedSelectorValue: string | undefined,
    dialogExpectation: ParsedTestStep['expectsDialog']
  ): ParsedTestStep {

    // If currentStep is empty after hint and dialog phrase removal, it's likely an incomplete/malformed step
    // or was only a hint + dialog phrase.
    if (!currentStep && mainHintedSelectorValue) {
        addLog(`Step became empty after hint and dialog processing, assuming 'click' on hinted target.`);
        return {
            action: 'click',
            target: finalizeSelector(mainHintedSelectorType, mainHintedSelectorValue),
            originalStep: originalStepInput,
            expectsDialog: dialogExpectation
        };
    }

    // 3. Parse standard actions using the (potentially modified) currentStep and mainHintedSelector (if any)
    if (matchesPattern(normalizedCurrentStep, ['navigate', 'go to', 'open', 'visit'])) {
      const url = extractQuotedText(currentStep) || extractUrl(currentStep) || mainHintedSelectorValue;
      addLog(`[ParseNavigate] Original step: "${originalStepInput}", Current step for URL: "${currentStep}", Extracted URL: "${url}"`);
      return {
        action: 'navigate',
        target: url,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation 
      };
    }
    
    const typeOrFillPattern = /^(?:type|enter|fill (?:in )?|input|write|set)(?: text| value)?\s+(.+?)(?:\s+(?:in|into|to|on)\s+(.+))?$/i;
    const typeMatch = currentStep.match(typeOrFillPattern);
    if (typeMatch) {
        addLog(`[TypeActionAttempt] Matched type pattern. Groups: ${JSON.stringify(typeMatch)}`);
        const rawValueToType = typeMatch[1].trim();
        const rawTargetField = typeMatch[2]?.trim();
        let valueToType = extractQuotedText(rawValueToType) ?? rawValueToType;
        addLog(`[TypeActionAttempt] Raw value: "${rawValueToType}", Extracted value: "${valueToType}"`);
        // Further refine the value to type by extracting potential email or password
        if (valueToType.includes('@') || valueToType.toLowerCase().includes('email')) {
            const emailMatch = valueToType.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
                valueToType = emailMatch[0];
                addLog(`[TypeActionAttempt] Extracted email: "${valueToType}" from "${rawValueToType}"`);
            }
        } else if (valueToType.toLowerCase().includes('password')) {
            const passwordMatch = valueToType.match(/(?:password\s+)([^\s].*?)$/i);
            if (passwordMatch && passwordMatch[1]) {
                valueToType = passwordMatch[1];
                addLog(`[TypeActionAttempt] Extracted password: "${valueToType}" from "${rawValueToType}"`);
            }
        }
        let finalTargetSelector: string | undefined;
        if (rawTargetField) {
            addLog(`[TypeActionAttempt] Raw target field specified: "${rawTargetField}"`);
            const targetHintResult = extractHintedSelector(rawTargetField);
            if (targetHintResult.selectorValue) {
                finalTargetSelector = finalizeSelector(targetHintResult.type, targetHintResult.selectorValue);
                addLog(`[TypeActionAttempt] Target field parsed as hint. Type: ${targetHintResult.type}, Final: "${finalTargetSelector}"`);
            } else {
                const unquotedTarget = extractQuotedText(rawTargetField) || rawTargetField;
                finalTargetSelector = extractGeneralSelector(unquotedTarget) || unquotedTarget;
                addLog(`[TypeActionAttempt] Target field parsed as non-hint. Using: "${finalTargetSelector}"`);
            }
        } else if (mainHintedSelectorValue) {
            addLog(`[TypeActionAttempt] No explicit target field. Using pre-parsed main hint selector.`);
            finalTargetSelector = finalizeSelector(mainHintedSelectorType, mainHintedSelectorValue);
        } else {
            addLog(`[TypeActionAttempt] No explicit target field and no main hint. Inferring target based on value content.`);
            // Infer target selector based on the content of valueToType
            if (valueToType.toLowerCase().includes('email') || valueToType.includes('@')) {
                finalTargetSelector = 'input[type="email"], #email, input[name="email"], input[placeholder*="email" i]';
                addLog(`[TypeActionAttempt] Inferred email input target: "${finalTargetSelector}"`);
            } else if (valueToType.toLowerCase().includes('password') || rawValueToType.toLowerCase().includes('password')) {
                finalTargetSelector = 'input[type="password"], #password, input[name="password"], input[placeholder*="password" i]';
                addLog(`[TypeActionAttempt] Inferred password input target: "${finalTargetSelector}"`);
            } else {
                finalTargetSelector = 'input, textarea';
                addLog(`[TypeActionAttempt] No specific content match, using generic input target: "${finalTargetSelector}"`);
            }
        }
        if (valueToType === '""' || valueToType === "''") valueToType = "";
        addLog(`[ParseSuccess] Action: type, Value: "${valueToType}", Target: "${finalTargetSelector}"`);
        return {
            action: 'type',
            value: valueToType,
            target: finalTargetSelector,
            originalStep: originalStepInput,
            expectsDialog: dialogExpectation
        };
    }

    if (matchesPattern(normalizedCurrentStep, ['click', 'press', 'tap'])) {
      let finalClickSelector = finalizeSelector(mainHintedSelectorType, mainHintedSelectorValue);
      if (!finalClickSelector) {
        const clickTargetPart = currentStep.replace(/click|press|tap/i, '').trim();
        const specificHintResult = extractHintedSelector(clickTargetPart);
        if (specificHintResult.selectorValue) {
            finalClickSelector = finalizeSelector(specificHintResult.type, specificHintResult.selectorValue);
        } else {
            // Original logic resumes here (bypass removed)
            addLog(`[ParseClickDebug] clickTargetPart: "${clickTargetPart}"`);
            let determinedSelector: string | undefined = undefined;
            const onElementPattern = /^(?:on element|element|for|on|containing text|with text|text|that has text|with value)\s+/i;
            
            if (onElementPattern.test(clickTargetPart)) {
                const targetDescriptionAfterKeyword = clickTargetPart.replace(onElementPattern, '').trim();
                addLog(`[ParseClickDebug] targetDescriptionAfterKeyword: "${targetDescriptionAfterKeyword}"`);
                
                const hintDirectlyAfterKeyword = extractHintedSelector(targetDescriptionAfterKeyword);
                if (hintDirectlyAfterKeyword.selectorValue) {
                    determinedSelector = finalizeSelector(hintDirectlyAfterKeyword.type, hintDirectlyAfterKeyword.selectorValue);
                    addLog(`[ParseClickDebug] Path A1: Determined from hintDirectlyAfterKeyword: "${determinedSelector}"`);
                } else {
                    const contentOfQuotes = extractQuotedText(targetDescriptionAfterKeyword);
                    addLog(`[ParseClickDebug] contentOfQuotes: "${contentOfQuotes}" (from targetDescriptionAfterKeyword)`);
                    if (contentOfQuotes) {
                        // Call extractHintedSelector directly on contentOfQuotes
                        const hintFromQuotedContent = extractHintedSelector(contentOfQuotes);
                        addLog(`[ParseClickDebug] hintFromQuotedContent result: ${JSON.stringify(hintFromQuotedContent)}`);

                        if (hintFromQuotedContent.selectorValue && hintFromQuotedContent.type) {
                            determinedSelector = finalizeSelector(hintFromQuotedContent.type, hintFromQuotedContent.selectorValue);
                            addLog(`[ParseClickDebug] Path A2: Determined from hintFromQuotedContent: "${determinedSelector}"`);
                        } else {
                            // If contentOfQuotes was not a valid hint, treat it as a raw selector value.
                            determinedSelector = contentOfQuotes; 
                            addLog(`[ParseClickDebug] Path A3: Determined from contentOfQuotes (not a hint pattern): "${determinedSelector}"`);
                        }
                    } else {
                        determinedSelector = targetDescriptionAfterKeyword; // Not quoted, use as is
                        addLog(`[ParseClickDebug] Path A4: Determined from targetDescriptionAfterKeyword (not quoted): "${determinedSelector}"`);
                    }
                }
            }

            // Ensure determinedSelector is used if found, otherwise fall back to broader extraction
            if (determinedSelector) { 
                finalClickSelector = determinedSelector;
                addLog(`[ParseClickDebug] Path B: finalClickSelector ASSIGNED from determinedSelector: "${finalClickSelector}"`);
            } else {
                finalClickSelector = extractGeneralSelector(clickTargetPart) || extractQuotedText(clickTargetPart);
                addLog(`[ParseClickDebug] Path C: finalClickSelector from general/quoted extract: "${finalClickSelector}"`);
            }
            
            if (!finalClickSelector && clickTargetPart) {
                addLog(`[ParseClickDebug] Path D: Entering broad XPath generation for clickTargetPart: "${clickTargetPart}"`);
                let xpath = `.//button[contains(normalize-space(.), "${clickTargetPart}")] | .//a[contains(normalize-space(.), "${clickTargetPart}")] | .//input[@type='submit' and @value="${clickTargetPart}"] | .//input[@type='button' and @value="${clickTargetPart}"] | .//*[@aria-label="${clickTargetPart}"] | .//*[self::button or self::a or self::input[@type='button'] or self::input[@type='submit']][normalize-space(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')) = '${clickTargetPart.toLowerCase()}'] | .//*[normalize-space(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')) = '${clickTargetPart.toLowerCase()}']`;
                if (clickTargetPart.toLowerCase() === 'search') {
                  xpath += ` | .//input[@type='submit'] | .//button[@type='submit'] | .//button[.//span[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search')]] | //*[@role='button' and contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search')]`;
                }
                finalClickSelector = `xpath:${xpath}`;
                addLog(`[ParseClick] No specific selector found for "${clickTargetPart}", using generated XPath: ${finalClickSelector}`);
            } else if (!finalClickSelector && !clickTargetPart && mainHintedSelectorValue) {
                finalClickSelector = finalizeSelector(mainHintedSelectorType, mainHintedSelectorValue);
                addLog(`[ParseClick] Click target part empty, falling back to main hint: ${finalClickSelector}`);
            } else if (!finalClickSelector && !clickTargetPart) {
                addLog(`[ParseClick] No selector could be determined for click action. Original: "${originalStepInput}"`);
            }
        }
      }
      addLog(`[ParseClick] Final selector for click: "${finalClickSelector}"`);
      return {
        action: 'click',
        target: finalClickSelector,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    if (mainHintedSelectorValue) {
        addLog(`No specific action matched after main hint. Assuming 'click' on hinted target: ${mainHintedSelectorValue}`);
        return {
            action: 'click',
            target: finalizeSelector(mainHintedSelectorType, mainHintedSelectorValue),
            originalStep: originalStepInput,
            expectsDialog: dialogExpectation
        };
    }
    
    const unquotedStep = extractQuotedText(originalStepInput) || originalStepInput;
    if (unquotedStep) {
        addLog(`No specific action or hint matched. Treating entire step "${unquotedStep}" as a click target (broad fallback).`);
        const broadXPath = `xpath:(//*[self::a or self::button or self::input[@type='button'] or self::input[@type='submit']][contains(normalize-space(.), "${unquotedStep}")] | //*[@aria-label="${unquotedStep}"] | //*[contains(normalize-space(@placeholder), "${unquotedStep}")])[1]`;
        return {
            action: 'click',
            target: broadXPath,
            originalStep: originalStepInput,
            expectsDialog: dialogExpectation
        };
    }

    addLog(`[ParseFail] Could not determine action for step: "${originalStepInput}". Defaulting to click with original step as target.`);
    return {
      action: 'click', 
      target: originalStepInput, 
      originalStep: originalStepInput,
      expectsDialog: dialogExpectation
    };
  }

  static parseStep(step: string): ParsedTestStep {
    addLog(`[ParseStep] Parsing step: "${step}"`);
    const normalizedStep = step.trim().replace(/\s+/g, ' ');
    let result: ParsedTestStep | null = null;
    
    // Check for AI-suggested type action format
    result = TestStepParser._tryParseTypeAction(step, step);
    if (result) {
      addLog(`[ParseStep] Successfully parsed as AI-suggested type action.`);
      return result;
    }

    const originalStepInput = step;
    let currentStep = step.trim();
    let normalizedCurrentStep = currentStep.toLowerCase();

    addLog(`[ParseAttempt] Original: "${originalStepInput}", Normalized: "${normalizedCurrentStep}"`);

    const waitAction = TestStepParser._tryParseWaitAction(normalizedCurrentStep, originalStepInput);
    if (waitAction) {
      addLog(`[TestStepParser.parseStep] After _tryParseWaitAction. Target: ${waitAction.target}`);
      return waitAction;
    }

    const iframeAction = TestStepParser._tryParseIframeSwitch(currentStep, normalizedCurrentStep, originalStepInput);
    if (iframeAction) {
      addLog(`[TestStepParser.parseStep] After _tryParseIframeSwitch. Target: ${iframeAction.target}`);
      return iframeAction;
    }

    const uploadAction = TestStepParser._tryParseUploadAction(currentStep, originalStepInput);
    if (uploadAction) {
      addLog(`[TestStepParser.parseStep] After _tryParseUploadAction. Target: ${uploadAction.target}`);
      return uploadAction;
    }

    const dragAndDropAction = TestStepParser._tryParseDragAndDropAction(currentStep, originalStepInput);
    if (dragAndDropAction) {
        addLog(`[TestStepParser.parseStep] After _tryParseDragAndDropAction. Target: ${dragAndDropAction.target}, DestTarget: ${dragAndDropAction.destinationTarget}`);
        return dragAndDropAction;
    }

    const assertionAction = TestStepParser._tryParseAssertions(currentStep, originalStepInput);
    if (assertionAction) {
        addLog(`[TestStepParser.parseStep] After _tryParseAssertions. Assertion Selector: ${assertionAction.assertion?.selector}`);
        return assertionAction;
    }

    // Try parsing execute script action BEFORE general hint extraction and fallbacks
    const executeScriptAction = TestStepParser._tryParseExecuteScriptAction(normalizedCurrentStep, originalStepInput);
    if (executeScriptAction) {
      // Using a substring for the script in logs to avoid overly long messages
      const scriptLogValue = executeScriptAction.value ? (executeScriptAction.value.length > 70 ? executeScriptAction.value.substring(0, 70) + '...' : executeScriptAction.value) : 'undefined';
      addLog(`[TestStepParser.parseStep] Parsed executeScript action. Frame: ${executeScriptAction.target}, Script: ${scriptLogValue}`);
      return executeScriptAction;
    }
    
    // 1. Extract a general hint for the primary target if not already an assertion
    let mainHintedSelectorType: string | undefined;
    let mainHintedSelectorValue: string | undefined;
    
    const hintResult = extractHintedSelector(currentStep);
    if (hintResult.selectorValue) {
        mainHintedSelectorType = hintResult.type;
        mainHintedSelectorValue = hintResult.selectorValue;
        currentStep = hintResult.remainingStep; 
        normalizedCurrentStep = currentStep.toLowerCase().trim(); 
        addLog(`[MainHintExtraction] Found hint. Type: ${mainHintedSelectorType}, Value: ${mainHintedSelectorValue}. Remaining step: "${currentStep}"`);
    }

    // 2. Extract dialog expectation and update step string
    const dialogResult = extractDialogExpectation(currentStep);
    const dialogExpectation = dialogResult.expectation;
    currentStep = dialogResult.remainingStep;
    normalizedCurrentStep = currentStep.toLowerCase().trim();
    
    // This will call _parseStandardActionsAndFallbacks if none of the above matched
    const standardOrFallbackAction = TestStepParser._parseStandardActionsAndFallbacks(
        currentStep, 
        normalizedCurrentStep, 
        originalStepInput, 
        mainHintedSelectorType,
        mainHintedSelectorValue,
        dialogExpectation
    );
    const returnedTarget = standardOrFallbackAction.target;
    addLog(`[TestStepParser.parseStep] After _parseStandardActionsAndFallbacks. standardOrFallbackAction.target: "${returnedTarget}" (Length: ${returnedTarget?.length})`);
    return standardOrFallbackAction;
  }
}