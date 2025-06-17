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

/** Utility: always return a concrete string (never undefined). */
const str = (maybe: string | undefined): string => maybe ?? '';

export class TestStepParser {
  
  private static _tryParseWaitAction(normalizedStep: string, originalStep: string): ParsedTestStep | null {
    const timePattern = /^(?:wait|pause)(?:\s+for)?\s+(\d+)\s*(milliseconds?|ms|seconds?|s)?/i;
    const timeMatch = normalizedStep.match(timePattern);

    const selectorPattern = /^(?:wait|pause)\s+for\s+(.+)/i;
    const selectorMatch = normalizedStep.match(selectorPattern);

    if (timeMatch && timeMatch[1]) {
      const timeoutValue = parseInt(timeMatch[1], 10);
      const unit = timeMatch[2]?.toLowerCase();
      let timeoutMs = timeoutValue;

      if (unit === 's' || unit === 'seconds' || !unit) {
        timeoutMs = timeoutValue * 1000;
      }

      addLog(`[WaitBlockEntered] Parsed timeout: ${timeoutMs}ms. Returning 'wait' action.`);
      return {
        action: 'wait',
        timeout: timeoutMs,
        originalStep: originalStep
      };
    }

    if (selectorMatch && selectorMatch[1]) {
      const selectorText = selectorMatch[1].trim();
      addLog(`[WaitSelector] Parsed selector wait for: ${selectorText}`);
      return {
        action: 'wait',
        target: selectorText,
        originalStep: originalStep
      };
    }

    addLog(`[WaitBlockSkipped] No wait pattern matched.`);
    return null;
  }

  private static _tryParseIframeSwitch(
    currentStep: string,
    normalizedCurrentStep: string,
    originalStepInput: string
  ): ParsedTestStep | null {
    addLog(
      `[DEBUG_IFRAME_SWITCH] Entered _tryParseIframeSwitch. currentStep: "${currentStep}", normalized: "${normalizedCurrentStep}"`
    );

    const switchToIframePattern = /(?:switch to|enter|focus on) iframe\s+(.+)/i;
    const iframeMatch = currentStep.match(switchToIframePattern);
    addLog(`[DEBUG_IFRAME_SWITCH] iframeMatch result: ${JSON.stringify(iframeMatch)}`);

    if (iframeMatch && iframeMatch[1]) {
      const rawArg = iframeMatch[1].trim();
      addLog(`[DEBUG_IFRAME_SWITCH] rawArg from iframeMatch[1]: "${rawArg}"`);

      let finalIframeSelector: string | undefined;
      let hintParseResult = extractHintedSelector(rawArg);

      if (hintParseResult.selectorValue) {
        finalIframeSelector = finalizeSelector(
          str(hintParseResult.type),
          str(hintParseResult.selectorValue)
        );
        addLog(
          `[switchToIframe] Parsed as direct hint. Type: ${str(hintParseResult.type)}, Final Selector: "${finalIframeSelector}"`
        );
      } else {
        // Maybe it was quoted; try extracting the quoted text first
        const unquotedArg = extractQuotedText(rawArg);
        if (unquotedArg !== undefined) {
          addLog(`[switchToIframe] Raw argument not a direct hint. Unquoted to: "${unquotedArg}"`);
          hintParseResult = extractHintedSelector(unquotedArg);

          if (hintParseResult.selectorValue) {
            finalIframeSelector = finalizeSelector(
              str(hintParseResult.type),
              str(hintParseResult.selectorValue)
            );
            addLog(
              `[switchToIframe] Parsed unquoted as hint. Type: ${str(hintParseResult.type)}, Final Selector: "${finalIframeSelector}"`
            );
          } else {
            // Use the unquoted text literally
            finalIframeSelector = unquotedArg;
            addLog(
              `[switchToIframe] Unquoted not a hint. Using as raw selector: "${finalIframeSelector}"`
            );
          }
        } else {
          // Neither a hint nor a quoted string—use rawArg verbatim
          finalIframeSelector = rawArg;
          addLog(
            `[switchToIframe] Not a hint, not quoted. Using as raw selector: "${finalIframeSelector}"`
          );
        }
      }

      addLog(`[ParseSuccess] Action: switchToIframe, Target: ${finalIframeSelector}`);
      return {
        action: 'switchToIframe',
        // finalIframeSelector is guaranteed to be a string here, so the "!" is safe:
        target: finalIframeSelector!,
        originalStep: originalStepInput
      };
    }

    const switchToMainContentPattern =
      /(?:switch to|return to|exit to|focus on) (?:main|default|top|parent) (?:content|document|page|frame)/i;
    if (switchToMainContentPattern.test(normalizedCurrentStep)) {
      addLog(`[ParseSuccess] Action: switchToMainContent`);
      return {
        action: 'switchToMainContent',
        originalStep: originalStepInput
      };
    }

    return null;
  }

  private static _tryParseUploadAction(
    currentStep: string,
    originalStepInput: string
  ): ParsedTestStep | null {
    // Pattern: "upload <filePath> to [element] <selector>"
    const uploadPattern = /(?:upload|attach file|set file)\s+(.+?)\s+(?:to|on|into)(?:\s+element)?\s+(.+)/i;
    const uploadMatch   = currentStep.match(uploadPattern);

    if (uploadMatch && uploadMatch[1] && uploadMatch[2]) {
      let filePathValue = extractQuotedText(uploadMatch[1].trim()) || uploadMatch[1].trim();
      if (filePathValue === '""' || filePathValue === "''") {
        filePathValue = ""; // handle an empty quoted string
      }

      let targetDescription = uploadMatch[2].trim();
      addLog(`[UploadParser] Initial targetDescription: "${targetDescription}"`);

      // If the target was quoted, extract it now:
      const unquotedTargetDesc = extractQuotedText(targetDescription);
      if (unquotedTargetDesc !== undefined) {
        addLog(`[UploadParser] Unquoted targetDescription: "${unquotedTargetDesc}"`);
        targetDescription = unquotedTargetDesc;
      }

      let finalUploadSelector: string | undefined;
      const hintResult       = extractHintedSelector(targetDescription);
      addLog(
        `[UploadParser] Hint result for "${targetDescription}": Type=${str(hintResult.type)}, Value=${str(hintResult.selectorValue)}`
      );

      if (hintResult.type && hintResult.selectorValue) {
        finalUploadSelector = finalizeSelector(
          str(hintResult.type),
          str(hintResult.selectorValue)
        );
        addLog(`[UploadParser] Final selector from hint: "${finalUploadSelector}"`);
      } else {
        // No valid hint—just use targetDescription literally
        finalUploadSelector = targetDescription;
        addLog(
          `[UploadParser] No valid hint, using targetDescription as selector: "${finalUploadSelector}"`
        );
      }

      if (!finalUploadSelector) {
        addLog(
          `[UploadParser] Could not determine target selector from "${uploadMatch[2].trim()}". Failing parse for upload.`
        );
        return null;
      }

      addLog(
        `[ParseSuccess] Action: upload, FilePath: "${filePathValue}", Target: "${finalUploadSelector}"`
      );
      return {
        action: 'upload',
        filePath: filePathValue,
        target: finalUploadSelector,
        originalStep: originalStepInput
      };
    }

    return null;
  }

  private static _tryParseDragAndDropAction(
    currentStep: string,
    originalStepInput: string
  ): ParsedTestStep | null {
    addLog(`[DEBUG_DND] Entered _tryParseDragAndDropAction. currentStep: "${currentStep}"`);
    const dragAndDropPattern = /(?:drag|move)\s+(.+?)\s+to\s+(.+)/i;
    const dndMatch           = currentStep.match(dragAndDropPattern);
    addLog(`[DEBUG_DND] dndMatch result: ${JSON.stringify(dndMatch)}`);

    if (dndMatch && dndMatch[1] && dndMatch[2]) {
      const sourceRaw       = dndMatch[1].trim();
      const destinationRaw  = dndMatch[2].trim();
      addLog(`[DEBUG_DND] sourceRaw: "${sourceRaw}", destinationRaw: "${destinationRaw}"`);

      // Source hint:
      const sourceHintResult = extractHintedSelector(sourceRaw);
      addLog(`[DEBUG_DND] sourceHintResult: ${JSON.stringify(sourceHintResult)}`);
      const sourceSelector = sourceHintResult.selectorValue
        ? finalizeSelector(
            str(sourceHintResult.type),
            str(sourceHintResult.selectorValue)
          )
        : extractQuotedText(sourceRaw) ?? sourceRaw;

      // Destination hint:
      const destinationHintResult = extractHintedSelector(destinationRaw);
      addLog(`[DEBUG_DND] destinationHintResult: ${JSON.stringify(destinationHintResult)}`);
      const destinationSelector = destinationHintResult.selectorValue
        ? finalizeSelector(
            str(destinationHintResult.type),
            str(destinationHintResult.selectorValue)
          )
        : extractQuotedText(destinationRaw) ?? destinationRaw;

      addLog(
        `[DEBUG_DND] Final sourceSelector: "${sourceSelector}", Final destinationSelector: "${destinationSelector}"`
      );
      return {
        action: 'dragAndDrop',
        target: sourceSelector,
        destinationTarget: destinationSelector,
        originalStep: originalStepInput
      };
    }

    addLog(`[DEBUG_DND] Pattern did not match or not enough groups.`);
    return null;
  }

  private static _tryParseAssertions(
    currentStep: string,
    originalStepInput: string
  ): ParsedTestStep | null {
    // 1) URL assertion:
    const assertUrlPattern = /^(?:assert|verify|check|expect)(?: that)? current url (is|equals|contains) (['"])(.*?)\2/i;
    const urlAssertMatch   = currentStep.match(assertUrlPattern);
    if (urlAssertMatch) {
      addLog(`[AssertURL] Matched: "${urlAssertMatch[0]}"`);
      const capturedCondition = urlAssertMatch[1].toLowerCase();
      const finalCondition = (capturedCondition === 'is' ? 'equals' : capturedCondition) as
        AssertionDetails['condition'];
      const expectedText  = urlAssertMatch[3];

      return {
        action: 'assert',
        originalStep: originalStepInput,
        assertion: {
          type: 'url',
          condition: finalCondition,
          expectedText: expectedText ?? ''
        }
      };
    }

    // 2) Structured assertion: assert "(type=..., selector=..., expected=..., condition=...)" 
    const structuredAssertPattern =
      /^(?:assert|verify|check|expect)\s+(['"])(\s*type\s*=\s*([^,]+?)\s*,\s*selector\s*=\s*([^,]+?)\s*,\s*expected\s*=\s*([^,]*?)\s*,\s*condition\s*=\s*([^,]+?)\s*)\1/i;
    const structuredAssertMatch = currentStep.match(structuredAssertPattern);

    if (structuredAssertMatch && structuredAssertMatch[2]) {
      addLog(`[StructuredAssert] Matched: "${structuredAssertMatch[0]}"`);
      const assertType   = (structuredAssertMatch[3] ?? '').trim() as AssertionDetails['type'];
      const selector     = (structuredAssertMatch[4] ?? '').trim();
      const expectedText = (structuredAssertMatch[5] ?? '').trim() === 'N/A' ? '' : (structuredAssertMatch[5] ?? '').trim();
      const condition    = (structuredAssertMatch[6] ?? '').trim() as AssertionDetails['condition'];

      if (!assertType || !selector || !condition) {
        addLog(
          `[StructuredAssert] Failed to parse essential parts from: "${structuredAssertMatch[2]}"`
        );
        return null;
      }

      addLog(
        `[StructuredAssert] Parsed - Type: ${assertType}, Selector: ${selector}, Expected: ${expectedText}, Condition: ${condition}`
      );
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

    // 3) General element assertion: "assert element <selector> [text] is visible/hidden/exists/etc"
    const generalAssertionPattern =
      /^(?:assert|verify|check|expect)(?: that)?\s+(?:(page)|(element|selector)\s+((?:\\(.+?\\)|[^\\s'"])+|'[^']+'|"[^"]+")(?:\s+(text))?\s+(is visible|is hidden|is not visible|exists|does not exist|is|equals|contains)(?:\s+(['"])(.*?)\7)?)$/i;

    const assertionMatch = currentStep.match(generalAssertionPattern);
    addLog(`[AssertGeneralElement] Attempting to match: "${currentStep}"`);
    addLog(`[AssertGeneralElement] Match result: ${JSON.stringify(assertionMatch)}`);

    if (assertionMatch) {
      let assertionType: AssertionDetails['type']    = 'elementVisible';
      let condition: AssertionDetails['condition']   = 'isVisible';
      let expectedText: string | undefined;
      let selector: string | undefined;

      if (assertionMatch[1]) {
        // "page" group matched → pageText assertion
        assertionType = 'pageText';
        condition = assertionMatch[6].toLowerCase() === 'contains'
          ? 'contains'
          : 'equals';
        expectedText = assertionMatch[8] ?? '';
      } else if (assertionMatch[2]) {
        // "element" or "selector" group matched
        selector = assertionMatch[3];
        selector = extractQuotedText(selector) ?? selector;
        addLog(`[AssertGeneralElement] Extracted selector: "${selector}"`);

        if (assertionMatch[5]) {
          // "text" keyword present → elementText assertion
          assertionType = 'elementText';
          condition = assertionMatch[6].toLowerCase() === 'contains'
            ? 'contains'
            : 'equals';
          expectedText = assertionMatch[8] ?? '';
        } else {
          // No "text" → visibility/exists
          const conditionText = assertionMatch[6].toLowerCase();
          if (conditionText === 'is visible') {
            assertionType = 'elementVisible';
            condition = 'isVisible';
            expectedText = 'true';
          } else if (
            conditionText === 'is hidden' ||
            conditionText === 'is not visible'
          ) {
            assertionType = 'elementVisible';
            condition = 'isVisible';
            expectedText = 'false';
          } else if (
            conditionText === 'exists' ||
            conditionText === 'does not exist'
          ) {
            assertionType = 'elementVisible';
            condition = 'isVisible';
            expectedText = conditionText === 'exists' ? 'true' : 'false';
          } else {
            // Fallback default to "visible = true"
            assertionType = 'elementVisible';
            condition = 'isVisible';
            expectedText = 'true';
          }
        }
      }

      return {
        action: 'assert',
        originalStep: originalStepInput,
        assertion: {
          type: assertionType,
          selector: selector ?? '',
          expectedText: expectedText ?? '',
          condition: condition
        }
      };
    }

    return null;
  }

  private static _tryParseExecuteScriptAction(
    normalizedStep: string,
    originalStepInput: string
  ): ParsedTestStep | null {
    const executeScriptPattern =
      /execute javascript in frame\s+(.+?)\s+with script\s+(.+?)(?:\s+(and expect (alert|confirm|prompt)(?: with text ['"](.*?)['"])? then (accept|dismiss)))?$/i;
    const match = originalStepInput.match(executeScriptPattern);

    if (match && match[1] && match[2]) {
      let frameSelector = match[1].trim();
      let script        = match[2].trim();

      const dialogKeywordOuter = match[3];
      const matchedDialogType  = match[4];
      const matchedPromptText  = match[5];
      const matchedDialogAction= match[6];

      frameSelector = extractQuotedText(frameSelector) || frameSelector;
      script        = extractQuotedText(script)        || script;

      if (!frameSelector || !script) {
        addLog(
          '[ParseWarning] ExecuteScript: Frame selector or script is empty after trim/unquote.'
        );
        return null;
      }

      if (!/^\((css|xpath):\s*.+\)$/i.test(frameSelector)) {
        addLog(
          `[ParseWarning] ExecuteScript: Frame selector "${frameSelector}" is not in the expected (type: value) format.`
        );
      }

      let dialogExpectation: ParsedTestStep['expectsDialog'] = undefined;
      if (dialogKeywordOuter && matchedDialogType && matchedDialogAction) {
        const type   = matchedDialogType.toLowerCase();
        const action = matchedDialogAction.toLowerCase();

        if (
          (type === 'alert' || type === 'confirm' || type === 'prompt') &&
          (action === 'accept' || action === 'dismiss')
        ) {
          dialogExpectation = {
            type: type as 'alert' | 'confirm' | 'prompt',
            response: action === 'accept' ? true : false
          };
          if (type === 'prompt' && action === 'accept' && matchedPromptText) {
            dialogExpectation.response = matchedPromptText;
          }
          addLog(
            `[ExecuteScript] Directly parsed dialog expectation: ${JSON.stringify(
              dialogExpectation
            )}`
          );
        } else {
          addLog(
            `[ExecuteScript] Parsed dialog type/action ("${type}", "${action}") are not valid.`
          );
        }
      } else if (dialogKeywordOuter) {
        addLog(
          `[ExecuteScript] Potential dialog phrase "${dialogKeywordOuter}" was incomplete or not recognized by the refined regex.`
        );
      }

      const scriptLogValue =
        script.length > 100 ? script.substring(0, 100) + '...' : script;
      addLog(
        `[ParseSuccess] Action: executeScript, FrameSelector: "${frameSelector}", Script: "${scriptLogValue}", Dialog: ${
          dialogExpectation ? 'Yes' : 'No'
        }`
      );

      return {
        action: 'executeScript',
        target: frameSelector,
        value: script,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    return null;
  }

  private static _tryParseTypeAction(
    currentStep: string,
    originalStepInput: string
  ): ParsedTestStep | null {
    const typePattern = /type\s+\(([^)]+)\)\s+with\s+value\s+(['"])(.*?)\2/i;
    const typeMatch   = currentStep.match(typePattern);

    if (typeMatch && typeMatch[1] && typeMatch[3]) {
      const selector = typeMatch[1].trim();
      const value    = typeMatch[3];
      addLog(
        `[TypeParser] Matched AI-suggested type action. Selector: ${selector}, Value: ${value}`
      );
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
    //
    // 1) If after stripping off any "hint" + any "dialog expectation" there is no text left,
    //    but we had a "main hinted selector," then assume "click" on that main hint:
    //
    if (!currentStep && mainHintedSelectorValue) {
      const safeMainType  = mainHintedSelectorType  ?? 'generic';
      const safeMainValue = mainHintedSelectorValue ?? '';

      addLog(
        `Step became empty after hint and dialog processing, ` +
          `assuming 'click' on hinted target: "${safeMainValue}".`
      );

      return {
        action: 'click',
        target: finalizeSelector(str(safeMainType), str(safeMainValue)),
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    //
    // 2) "navigate/go to/open/visit" pattern
    //
    if (matchesPattern(normalizedCurrentStep, ['navigate', 'go to', 'open', 'visit', 'launch', 'start', 'access', 'load'])) {
      const url =
        extractQuotedText(currentStep) ||
        extractUrl(currentStep) ||
        mainHintedSelectorValue ||
        '';

      addLog(
        `[ParseNavigate] Original step: "${originalStepInput}", ` +
          `Current step for URL: "${currentStep}", Extracted URL: "${url}"`
      );

      return {
        action: 'navigate',
        target: url,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    //
    // 3) "type/enter/fill in/input/write/set ... (value) ... in/into/to/on (selector)"
    //
    const typeOrFillPattern =
      /^(?:type|enter|fill (?:in )?|input|write|set)(?: text| value)?\s+(.+?)(?:\s+(?:in|into|to|on)\s+(.+))?$/i;
    const typeMatch = currentStep.match(typeOrFillPattern);

    const typeAltPattern = /^(?:type|enter|fill|input|write|set)(?: text| value)?\s+([^\s]+)\s+with\s+(.+)/i;
    const typeMatchAlt = currentStep.match(typeAltPattern);

    if (typeMatch || typeMatchAlt) {
      addLog(`[TypeActionAttempt] Matched type pattern. Groups: ${JSON.stringify(typeMatch)}`);

      const rawValueToType  = typeMatch ? typeMatch[1].trim() : typeMatchAlt![2].trim();
      const rawTargetField  = typeMatch ? typeMatch[2]?.trim() : typeMatchAlt![1].trim();
      let valueToType       = extractQuotedText(rawValueToType) ?? rawValueToType;

      addLog(
        `[TypeActionAttempt] Raw value: "${rawValueToType}", Extracted value: "${valueToType}"`
      );

      // If it looks like an email or contains '@', pull out just the email
      if (valueToType.includes('@') || valueToType.toLowerCase().includes('email')) {
        const emailMatch = valueToType.match(
          /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
        );
        if (emailMatch) {
          valueToType = emailMatch[0];
          addLog(`[TypeActionAttempt] Extracted email: "${valueToType}" from "${rawValueToType}"`);
        }
      } else if (/^(?:a\s+)?(?:valid|correct)\s+password$/i.test(valueToType)) {
        // Placeholder for valid/correct password
        if (process.env.LABNEX_VALID_PASSWORD) {
          valueToType = process.env.LABNEX_VALID_PASSWORD;
        } else {
          valueToType = '__PROMPT_VALID_PASSWORD__';
        }
        addLog(`[TypeActionAttempt] Placeholder 'valid/correct password' detected.`);

      } else if (valueToType.toLowerCase().includes('password')) {
        // If it looks like "password fooBar!", capture just fooBar! 
        const passwordMatch = valueToType.match(/(?:password\s+)([^\s].*?)$/i);
        if (passwordMatch && passwordMatch[1]) {
          valueToType = passwordMatch[1];
          addLog(
            `[TypeActionAttempt] Extracted password: "${valueToType}" from "${rawValueToType}"`
          );
        }
      } else if (valueToType.toLowerCase().startsWith('username ')) {
        valueToType = valueToType.replace(/^username\s+/i, '');
        addLog(`[TypeActionAttempt] Stripped 'username' prefix. New value: "${valueToType}"`);
      } else if (valueToType.toLowerCase().startsWith('first name ')) {
        valueToType = valueToType.replace(/^first name\s+/i, '');
        addLog(`[TypeActionAttempt] Stripped 'first name' prefix. New value: "${valueToType}"`);
      } else if (valueToType.toLowerCase().startsWith('last name ')) {
        valueToType = valueToType.replace(/^last name\s+/i, '');
        addLog(`[TypeActionAttempt] Stripped 'last name' prefix. New value: "${valueToType}"`);
      } else if (valueToType.toLowerCase().startsWith('zip ')) {
        valueToType = valueToType.replace(/^zip\s+/i, '');
        addLog(`[TypeActionAttempt] Stripped 'zip' prefix. New value: "${valueToType}"`);
        if (/^\d{1,4}$/.test(valueToType)) {
          const needed = 5 - valueToType.length;
          valueToType = valueToType + ''.padEnd(needed, '0');
          addLog(`[TypeActionAttempt] Padded ZIP to 5 digits: "${valueToType}"`);
        }
      } else if (/^a\s+(valid|correct)\s+username$/i.test(valueToType) || /^(valid|correct)\s+username$/i.test(valueToType)) {
        if (process.env.LABNEX_VALID_USERNAME) {
          valueToType = process.env.LABNEX_VALID_USERNAME;
        } else {
          valueToType = '__PROMPT_VALID_USERNAME__';
        }
        addLog(`[TypeActionAttempt] Placeholder 'valid username' detected.`);
      }

      let finalTargetSelector: string | undefined;

      if (rawTargetField) {
        addLog(`[TypeActionAttempt] Raw target field specified: "${rawTargetField}"`);
        const targetHintResult = extractHintedSelector(rawTargetField);

        if (targetHintResult.selectorValue) {
          const safeType          = str(targetHintResult.type);
          const safeSelectorValue = str(targetHintResult.selectorValue);
          finalTargetSelector     = finalizeSelector(safeType, safeSelectorValue);
          if (!finalTargetSelector) {
            finalTargetSelector = 'default-selector';
          }

          addLog(
            `[TypeActionAttempt] Target field parsed as hint. Type: ${safeType}, Final: "${finalTargetSelector}"`
          );
        } else {
          // No hint, so either quoted selector or generic phrases
          const unquotedTarget = extractQuotedText(rawTargetField) || rawTargetField;

          const lowerTarg = unquotedTarget.toLowerCase();
          if (lowerTarg.includes('username')) {
            finalTargetSelector = 'input[id*="user" i], input[name*="user" i], input[placeholder*="user" i]';
            addLog(`[TypeActionAttempt] Inferred username selector from target field: "${finalTargetSelector}"`);
          } else if (lowerTarg.includes('password')) {
            finalTargetSelector = 'input[type="password"], #password, input[name="password"], input[placeholder*="password" i]';
            addLog(`[TypeActionAttempt] Inferred password selector from target field: "${finalTargetSelector}"`);
          } else {
            finalTargetSelector = extractGeneralSelector(unquotedTarget) || unquotedTarget;
            addLog(`[TypeActionAttempt] Target field parsed as non-hint. Using: "${finalTargetSelector}"`);
          }
        }
      } else if (mainHintedSelectorValue) {
        addLog(`[TypeActionAttempt] No explicit target field. Using pre-parsed main hint selector.`);
        const safeMainType  = str(mainHintedSelectorType);
        const safeMainValue = str(mainHintedSelectorValue);
        finalTargetSelector = finalizeSelector(safeMainType, safeMainValue || 'default-selector');
      } else {
        addLog(
          `[TypeActionAttempt] No explicit target field and no main hint. Inferring target based on value content.`
        );

        if (valueToType.toLowerCase().includes('email') || valueToType.includes('@')) {
          finalTargetSelector =
            'input[type="email"], #email, input[name="email"], input[placeholder*="email" i], input[id*="user" i], input[name*="user" i], input[placeholder*="user" i]';
          addLog(
            `[TypeActionAttempt] Inferred email input target: "${finalTargetSelector}"`
          );
        } else if (
          valueToType.toLowerCase().includes('password') ||
          rawValueToType.toLowerCase().includes('password')
        ) {
          finalTargetSelector =
            'input[type="password"], #password, input[name="password"], input[placeholder*="password" i]';
          addLog(
            `[TypeActionAttempt] Inferred password input target: "${finalTargetSelector}"`
          );
        } else {
          const lowerOriginal = originalStepInput.toLowerCase();
          if (lowerOriginal.includes('first name')) {
            finalTargetSelector = 'input[id*="first" i], input[name*="first" i], input[placeholder*="first" i]';
            addLog(`[TypeActionAttempt] Inferred first-name input selector: "${finalTargetSelector}"`);
          } else if (lowerOriginal.includes('last name')) {
            finalTargetSelector = 'input[id*="last" i], input[name*="last" i], input[placeholder*="last" i]';
            addLog(`[TypeActionAttempt] Inferred last-name input selector: "${finalTargetSelector}"`);
          } else if (lowerOriginal.includes('zip') || lowerOriginal.includes('postal')) {
            finalTargetSelector = 'input[id*="zip" i], input[name*="zip" i], input[placeholder*="zip" i]';
            addLog(`[TypeActionAttempt] Inferred zip input selector: "${finalTargetSelector}"`);
          } else if (lowerOriginal.includes('username') || lowerOriginal.includes('user name')) {
            finalTargetSelector = 'input[id*="user" i], input[name*="user" i], input[placeholder*="user" i]';
            addLog(`[TypeActionAttempt] Inferred username input selector: "${finalTargetSelector}"`);
          } else {
            finalTargetSelector = 'input, textarea';
            addLog(
              `[TypeActionAttempt] No specific content match, using generic input target: "${finalTargetSelector}"`
            );
          }
        }
      }

      // If the user literally typed "" or '', treat it as an empty string
      if (valueToType === '""' || valueToType === "''") {
        valueToType = "";
      }

      addLog(
        `[ParseSuccess] Action: type, Value: "${valueToType}", Target: "${finalTargetSelector}"`
      );
      return {
        action: 'type',
        value: valueToType,
        // We used a non-null assertion (!) because every branch above guarantees it's a non‐undefined string
        target: finalTargetSelector!,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    //
    // 4) "click/tap/press/select on the <ordinal?> <target> [button|link|...]"
    //
    const clickPattern =
      /^(?:click|tap|press|select)(?: on)?(?: the)?\s+((?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th)?)?\s+)?(.+?)(?:\s+(?:button|link|element|field|checkbox|radio|option|tab|item))?$/i;
    const clickMatch = currentStep.match(clickPattern);

    if (clickMatch) {
      addLog(
        `[ClickActionAttempt] Matched click pattern. Groups: ${JSON.stringify(clickMatch)}`
      );

      const positionText = clickMatch[1]?.trim() || '';
      const rawTarget    = clickMatch[2].trim();
      let index          = 0;

      if (positionText) {
        if (/^\d+/.test(positionText)) {
          index = parseInt(positionText, 10) - 1; // Convert to 0-based index
        } else {
          const ordinalMap: Record<string, number> = {
            first: 0,
            second: 1,
            third: 2,
            fourth: 3,
            fifth: 4,
            sixth: 5,
            seventh: 6,
            eighth: 7,
            ninth: 8,
            tenth: 9
          };
          index = ordinalMap[positionText.toLowerCase()] ?? 0;
        }
      }

      addLog(
        `[ClickActionAttempt] Position: ${positionText || 'none'}, Index: ${index}, Raw Target: "${rawTarget}"`
      );

      // Try extracting a hinted selector
      const hintResult            = extractHintedSelector(rawTarget);
      let finalTargetSelector = '';

      if (hintResult.selectorValue) {
        // Coalesce hintResult.type and hintResult.selectorValue into real strings
        const safeType          = str(hintResult.type);
        const safeSelectorValue = str(hintResult.selectorValue);
        const tempSelector      = finalizeSelector(safeType, safeSelectorValue);
        finalTargetSelector     = tempSelector || 'default-selector';

        addLog(
          `[ClickActionAttempt] Using hinted selector: "${finalTargetSelector}"`
        );
      } else {
        const unquotedTarget = extractQuotedText(rawTarget) ?? rawTarget;
        // If it's a "checkbox" text, pick a generic checkbox input
        if (unquotedTarget.toLowerCase().includes('checkbox')) {
          finalTargetSelector = 'input[type="checkbox"]';
          addLog(
            `[ClickActionAttempt] Inferred checkbox selector: "${finalTargetSelector}"`
          );
        } else {
          finalTargetSelector = unquotedTarget;
          addLog(
            `[ClickActionAttempt] Using unquoted/raw target as selector: "${finalTargetSelector}"`
          );
        }
      }

      return {
        action: 'click',
        target: finalTargetSelector,
        index: index,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    //
    // 5) If none of the above matched, but we do have a "main hinted selector," click it:
    //
    if (mainHintedSelectorValue) {
      const safeMainType  = str(mainHintedSelectorType);
      const safeMainValue = str(mainHintedSelectorValue);
      addLog(
        `No specific action matched after main hint. ` +
          `Assuming 'click' on hinted target: "${safeMainValue}".`
      );

      return {
        action: 'click',
        target: finalizeSelector(safeMainType, safeMainValue || 'default-selector'),
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    //
    // 6) Last fallback: treat the entire step text as the thing to "click":
    //
    const unquotedStep = extractQuotedText(originalStepInput) || originalStepInput;
    if (unquotedStep) {
      addLog(
        `No specific action or hint matched. Treating entire step "${unquotedStep}" as a click target (broad fallback).`
      );
      const broadXPath = `xpath:(//*[self::a or self::button or self::input[@type='button'] or self::input[@type='submit']][contains(normalize-space(.), "${unquotedStep}")] | //*[@aria-label="${unquotedStep}"] | //*[contains(normalize-space(@placeholder), "${unquotedStep}")])[1]`;
      return {
        action: 'click',
        target: broadXPath,
        originalStep: originalStepInput,
        expectsDialog: dialogExpectation
      };
    }

    //
    // 7) If we truly can't parse anything, default to clicking the raw step string:
    //
    addLog(
      `[ParseFail] Could not determine action for step: "${originalStepInput}". Defaulting to click with original step as target.`
    );
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
    if (/^\s*skip\b/i.test(normalizedStep)) {
      return { action: 'skip', originalStep: step } as ParsedTestStep;
    }

    let result: ParsedTestStep | null = null;

    // 0) Check if it's already the AI "type (css: ...) with value" format:
    result = TestStepParser._tryParseTypeAction(step, step);
    if (result) {
      addLog(`[ParseStep] Successfully parsed as AI-suggested type action.`);
      return result;
    }

    const originalStepInput    = step;
    let currentStep            = step.trim();
    let normalizedCurrentStep  = currentStep.toLowerCase();

    addLog(
      `[ParseAttempt] Original: "${originalStepInput}", Normalized: "${normalizedCurrentStep}"`
    );

    // 1) "wait/pause for X seconds"
    const waitAction = TestStepParser._tryParseWaitAction(
      normalizedCurrentStep,
      originalStepInput
    );
    if (waitAction) {
      addLog(
        `[TestStepParser.parseStep] After _tryParseWaitAction. Target: ${waitAction.target}`
      );
      return waitAction;
    }

    // 2) "switch to iframe ..." or "switch to main content"
    const iframeAction = TestStepParser._tryParseIframeSwitch(
      currentStep,
      normalizedCurrentStep,
      originalStepInput
    );
    if (iframeAction) {
      addLog(
        `[TestStepParser.parseStep] After _tryParseIframeSwitch. Target: ${iframeAction.target}`
      );
      return iframeAction;
    }

    // 3) "upload/attach file to ..."
    const uploadAction = TestStepParser._tryParseUploadAction(
      currentStep,
      originalStepInput
    );
    if (uploadAction) {
      addLog(
        `[TestStepParser.parseStep] After _tryParseUploadAction. Target: ${uploadAction.target}`
      );
      return uploadAction;
    }

    // 4) "drag <source> to <destination>"
    const dragAndDropAction = TestStepParser._tryParseDragAndDropAction(
      currentStep,
      originalStepInput
    );
    if (dragAndDropAction) {
      addLog(
        `[TestStepParser.parseStep] After _tryParseDragAndDropAction. ` +
          `Target: ${dragAndDropAction.target}, DestTarget: ${dragAndDropAction.destinationTarget}`
      );
      return dragAndDropAction;
    }

    // 5) Various "assert" patterns
    const assertionAction = TestStepParser._tryParseAssertions(
      currentStep,
      originalStepInput
    );
    if (assertionAction) {
      addLog(
        `[TestStepParser.parseStep] After _tryParseAssertions. ` +
          `Assertion Selector: ${assertionAction.assertion?.selector}`
      );
      return assertionAction;
    }

    // 6) "execute javascript in frame ... with script ... (and expect dialog)"
    const executeScriptAction = TestStepParser._tryParseExecuteScriptAction(
      normalizedCurrentStep,
      originalStepInput
    );
    if (executeScriptAction) {
      const scriptLogValue = executeScriptAction.value
        ? executeScriptAction.value.length > 70
          ? executeScriptAction.value.substring(0, 70) + '...'
          : executeScriptAction.value
        : 'undefined';
      addLog(
        `[TestStepParser.parseStep] Parsed executeScript action. ` +
          `Frame: ${executeScriptAction.target}, Script: ${scriptLogValue}`
      );
      return executeScriptAction;
    }

    //
    // 7) Extract a "main hinted selector" if the user wrote something like "(css: #foo) click foo"
    //
    let mainHintedSelectorType: string | undefined;
    let mainHintedSelectorValue: string | undefined;

    const hintResult = extractHintedSelector(currentStep);
    if (hintResult.selectorValue) {
      mainHintedSelectorType  = hintResult.type;
      mainHintedSelectorValue = hintResult.selectorValue;
      currentStep             = hintResult.remainingStep;
      normalizedCurrentStep   = currentStep.toLowerCase().trim();
      addLog(
        `[MainHintExtraction] Found hint. Type: ${mainHintedSelectorType}, ` +
          `Value: ${mainHintedSelectorValue}. Remaining step: "${currentStep}"`
      );
    }

    //
    // 8) Extract any dialog expectation (like "then accept alert")
    //
    const dialogResult       = extractDialogExpectation(currentStep);
    const dialogExpectation  = dialogResult.expectation;
    currentStep             = dialogResult.remainingStep;
    normalizedCurrentStep   = currentStep.toLowerCase().trim();

    // Narrative navigation phrases like "Launch the application..." or "Start the website..."
    const narrativeNavRegex = /^(launch|start|open|access|load)\b.+(application|website|app)\b/i;
    if (narrativeNavRegex.test(originalStepInput) && !extractUrl(originalStepInput)) {
      addLog(`[NarrativeNavigate] Detected high-level navigation step. Treating as navigate to base URL.`);
      return {
        action: 'navigate',
        target: '', // Will be resolved to baseUrl in executor
        originalStep: originalStepInput,
        expectsDialog: undefined
      };
    }

    //
    // 9) Everything else falls through to "standard actions + fallback":
    //
    const standardOrFallbackAction = TestStepParser._parseStandardActionsAndFallbacks(
      currentStep,
      normalizedCurrentStep,
      originalStepInput,
      mainHintedSelectorType,
      mainHintedSelectorValue,
      dialogExpectation
    );
    const returnedTarget = standardOrFallbackAction.target;
    addLog(
      `[TestStepParser.parseStep] After _parseStandardActionsAndFallbacks. ` +
        `standardOrFallbackAction.target: "${returnedTarget}" (Length: ${returnedTarget?.length})`
    );
    return standardOrFallbackAction;
  }
}
