export interface ParsedTestStep {
  action: 'navigate' | 'click' | 'type' | 'wait' | 'assert' | 'select' | 'scroll' | 'hover';
  target?: string;
  value?: string;
  timeout?: number;
  originalStep: string;
}

export class TestStepParser {
  
  static parseStep(step: string): ParsedTestStep {
    const normalizedStep = step.toLowerCase().trim();
    
    // Navigation patterns
    if (this.matchesPattern(normalizedStep, ['navigate', 'go to', 'open', 'visit'])) {
      const url = this.extractUrl(step) || this.extractQuotedText(step);
      return {
        action: 'navigate',
        target: url,
        originalStep: step
      };
    }
    
    // Click patterns - Attempt to find by text if specific selector fails
    if (this.matchesPattern(normalizedStep, ['click', 'press', 'tap'])) {
      // Try to extract a specific selector first
      let selector = this.extractSpecificSelector(step);
      if (!selector) {
        // If no specific selector, try to find an element by its text content
        const textToClick = this.extractQuotedText(step.replace(/click|press|tap/i, '').trim());
        if (textToClick) {
          // Base XPath targeting common interactive elements by text, value, or aria-label
          let xpath = `.//button[contains(normalize-space(.), "${textToClick}")] | .//a[contains(normalize-space(.), "${textToClick}")] | .//input[@type='submit' and @value="${textToClick}"] | .//input[@type='button' and @value="${textToClick}"] | (.//button | .//input | .//a)[contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${textToClick.toLowerCase()}')]`;

          // If the click target is commonly associated with 'search', add more general fallbacks
          if (textToClick.toLowerCase() === 'search') {
            xpath += ` | .//input[@type='submit'] | .//button[@type='submit'] | .//button[.//span[contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search')]] | //*[@role='button' and contains(translate(normalize-space(.),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'search')]`;
          }
          selector = `xpath/${xpath}`;
        } else {
            // Fallback to broader selector extraction if no text is quoted
            selector = this.extractSelector(step);
        }
      }
      return {
        action: 'click',
        target: selector,
        originalStep: step
      };
    }
    
    // Type/Input patterns - Improved logic
    if (this.matchesPattern(normalizedStep, ['type', 'enter', 'input', 'fill'])) {
      let valueToType: string | undefined;
      let targetDescriptor: string | undefined;

      // Simplified Regex to capture: type (anything) into (anything else)
      const typeIntoPattern = /type\s+(.+?)\s+into\s+(.+)/i;
      const typeMatch = step.match(typeIntoPattern);

      if (typeMatch && typeMatch[1] && typeMatch[2]) {
        valueToType = (this.extractQuotedText(typeMatch[1].trim()) || typeMatch[1].trim()); 
        targetDescriptor = (this.extractQuotedText(typeMatch[2].trim()) || typeMatch[2].trim()); 
      } else {
        // Fallback if "into" pattern doesn't match or captures are null
        valueToType = this.extractQuotedText(step); // Extract first quoted string as value
        if (valueToType) {
            targetDescriptor = step.substring(step.toLowerCase().indexOf(valueToType.toLowerCase()) + valueToType.length)
                                 .replace(/type|enter|input|fill/gi, '').trim();
            if (targetDescriptor.startsWith('into')) targetDescriptor = targetDescriptor.substring(4).trim();
            targetDescriptor = this.extractQuotedText(targetDescriptor) || targetDescriptor; 
        }
        if (!targetDescriptor && valueToType) { 
            let remainingStepForTarget = step.replace(`"${valueToType}"`,'').replace(`'${valueToType}'`,'');
            targetDescriptor = this.extractSpecificSelector(remainingStepForTarget) || this.extractInputField(remainingStepForTarget.replace(/type|enter|input|fill/gi, ''));
        } else if (!targetDescriptor && !valueToType) {
            // Could not determine value or target, fallback to old selector logic for target
            targetDescriptor = this.extractSpecificSelector(step) || this.extractInputField(step.replace(/type|enter|input|fill/gi, ''));
        }
      }
      
      const finalSelector = this.findSelectorForTyping(targetDescriptor);

      return {
        action: 'type',
        target: finalSelector,
        value: valueToType,
        originalStep: step
      };
    }
    
    // Wait patterns
    if (this.matchesPattern(normalizedStep, ['wait', 'pause', 'delay'])) {
      const timeout = this.extractTimeout(step) || 3000;
      return {
        action: 'wait',
        timeout: timeout,
        originalStep: step
      };
    }
    
    // Assert patterns
    if (this.matchesPattern(normalizedStep, ['verify', 'check', 'assert', 'should', 'expect'])) {
      const target = this.extractQuotedText(step) || this.extractSelector(step);
      return {
        action: 'assert',
        target: target,
        originalStep: step
      };
    }
    
    // Select dropdown patterns
    if (this.matchesPattern(normalizedStep, ['select', 'choose', 'pick'])) {
      const value = this.extractValue(step);
      const selector = this.extractSelector(step) || this.extractDropdownField(step);
      return {
        action: 'select',
        target: selector,
        value: value,
        originalStep: step
      };
    }
    
    // Scroll patterns
    if (this.matchesPattern(normalizedStep, ['scroll', 'swipe'])) {
      const target = this.extractScrollTarget(step);
      return {
        action: 'scroll',
        target: target,
        originalStep: step
      };
    }
    
    // Hover patterns
    if (this.matchesPattern(normalizedStep, ['hover', 'mouseover'])) {
      const selector = this.extractSelector(step) || this.extractQuotedText(step);
      return {
        action: 'hover',
        target: selector,
        originalStep: step
      };
    }
    
    // Default to click if no other pattern matches
    return {
      action: 'click',
      target: this.extractQuotedText(step) || step,
      originalStep: step
    };
  }
  
  private static matchesPattern(step: string, keywords: string[]): boolean {
    return keywords.some(keyword => step.includes(keyword));
  }
  
  private static extractUrl(step: string): string | undefined {
    const urlPattern = /(https?:\/\/[^\s]+)/i;
    const match = step.match(urlPattern);
    return match ? match[1] : undefined;
  }
  
  private static extractQuotedText(step: string): string | undefined {
    const quotedPattern = /["'](.*?)["']/;
    const match = step.match(quotedPattern);
    return match ? match[1] : undefined;
  }
  
  private static extractSpecificSelector(step: string): string | undefined {
    // Try in order: ID, class, data-attribute, input[name=…], button[name=…], then bare tag
    const patterns: RegExp[] = [
      /(#[\w-]+)/,                                              // #id
      /(\.[\w-]+)/,                                             // .class
      /(\[data-[\w-]+(?:=(?:"[^"]*"|'[^']*'|[^\]\s]+))?\])/,    // [data-foo], [data-foo="bar"]
      /(input\[name=['"]?[\w-]+['"]?\])/i,                      // input[name=…]
      /(button\[name=['"]?[\w-]+['"]?\])/i,                     // button[name=…]
      /<([A-Za-z][\w-]*)/                                       // <tagName
    ];
    
    for (const pattern of patterns) {
      const match = step.match(pattern);
      if (match) {
        return match[1];
      }
    }
  
    // If nothing specific matched, give up rather than returning a generic 'button' or 'input'
    return undefined;
  }
  
  
  private static extractSelector(step: string): string | undefined {
    const specific = this.extractSpecificSelector(step);
    if (specific) return specific;

    // Fallback to very generic element types if mentioned
    if (step.match(/button/i)) return 'button';
    if (step.match(/input/i)) return 'input';
    if (step.match(/link|a /i)) return 'a'; // Look for 'a ' to avoid matching 'navigate'
    if (step.match(/form/i)) return 'form';
    // Add more generic fallbacks if needed
    return undefined;
  }
  
  private static extractValue(step: string): string | undefined {
    // Extract value from common patterns
    const patterns = [
      /with ["'](.*?)["']/, // "with 'value'"
      /value ["'](.*?)["']/, // "value 'text'"
      /["'](.*?)["'](?=.*(?:into|in))/ // "'value' into field"
    ];
    
    for (const pattern of patterns) {
      const match = step.match(pattern);
      if (match) return match[1];
    }
    
    return this.extractQuotedText(step);
  }
  
  private static extractInputField(step: string): string | undefined {
    const fieldPatterns = [
      /username|user|login/i,
      /password|pass/i,
      /email|mail/i,
      /name|full.?name/i,
      /phone|mobile/i,
      /address/i,
      /search|query/i
    ];
    
    for (const pattern of fieldPatterns) {
      if (pattern.test(step)) {
        return `input[type="${this.getInputType(pattern)}"], input[name*="${this.getFieldName(pattern)}"]`;
      }
    }
    
    return 'input';
  }
  
  private static extractDropdownField(step: string): string | undefined {
    if (step.includes('dropdown') || step.includes('select')) {
      return 'select';
    }
    return undefined;
  }
  
  private static extractScrollTarget(step: string): string | undefined {
    if (step.includes('top')) return 'top';
    if (step.includes('bottom')) return 'bottom';
    if (step.includes('up')) return 'up';
    if (step.includes('down')) return 'down';
    return 'down';
  }
  
  private static extractTimeout(step: string): number | undefined {
    const timePattern = /(\d+)\s*(second|sec|ms|millisecond)/i;
    const match = step.match(timePattern);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit.startsWith('ms') ? value : value * 1000;
    }
    return undefined;
  }
  
  private static getInputType(pattern: RegExp): string {
    if (pattern.source.includes('password')) return 'password';
    if (pattern.source.includes('email')) return 'email';
    return 'text';
  }
  
  private static getFieldName(pattern: RegExp): string {
    if (pattern.source.includes('username')) return 'username';
    if (pattern.source.includes('password')) return 'password';
    if (pattern.source.includes('email')) return 'email';
    if (pattern.source.includes('name')) return 'name';
    if (pattern.source.includes('phone')) return 'phone';
    if (pattern.source.includes('address')) return 'address';
    if (pattern.source.includes('search')) return 'search';
    return 'text';
  }

  private static findSelectorForTyping(descriptor?: string): string | undefined {
    if (!descriptor) return 'input'; // Default to generic input if no descriptor

    // 1. If descriptor is already a CSS selector (starts with #, ., [)
    if (descriptor.match(/^[#.]/)) return descriptor; // Check for # or . at the start

    // 2. Try common input attributes based on descriptor text
    // (e.g., descriptor "username" -> try input[name="username"], input[placeholder*="username"], etc.)
    const commonInputAttributes = ['name', 'id', 'placeholder', 'aria-label', 'title'];
    for (const attr of commonInputAttributes) {
        // Exact match or contains selector
        const exactSelector = `input[${attr}="${descriptor}"], textarea[${attr}="${descriptor}"]`;
        // More flexible: contains word, case-insensitive for placeholder/aria-label
        const containsSelector = `input[${attr}*="${descriptor}"i], textarea[${attr}*="${descriptor}"i]`; 
        // For this PoC, we'll just return a generic pattern, but real implementation would test these
        // For now, let's try a common pattern
        if (descriptor.toLowerCase().includes('search') || descriptor.toLowerCase().includes('query')) {
            return 'textarea[name*="q"], textarea[title*="Search"i], input[type="search"], input[name*="q"], input[name*="query"], input[name*="search"], input[id*="search"], input[placeholder*="search"i]';
        }
        if (descriptor.toLowerCase().includes('email')) {
            return 'input[type="email"], input[name*="email"], input[id*="email"]';
        }
        if (descriptor.toLowerCase().includes('password')) {
            return 'input[type="password"], input[name*="password"], input[id*="password"]';
        }
    }
    
    // 3. Fallback: if descriptor is just text, assume it might be a placeholder or visible label for an input
    // This is complex to do reliably without context; for now, return a generic input or the descriptor itself
    // if it seems like it could be a loose selector.
    // If descriptor has spaces, it's less likely a direct selector, more like a label.
    if (descriptor.includes(' ')) {
        // Attempt to find an input associated with a label containing this text (simplified)
        // return `xpath/.//label[contains(normalize-space(.),"${descriptor}")]/following-sibling::input[1] | .//label[contains(normalize-space(.),"${descriptor}")]/input | input[@aria-label="${descriptor}"] | input[@placeholder="${descriptor}"]`;
        // For simplicity now, return a generic input, or let Puppeteer try the descriptor
         return `input[placeholder*="${descriptor}"i], input[aria-label*="${descriptor}"i], input[name*="${descriptor}"i], #${descriptor}, .${descriptor}`;
    }

    // 4. Default to the descriptor itself (might be a class, or simple tag) or generic input
    return descriptor || 'input';
  }
} 