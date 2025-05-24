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
    
    // Click patterns
    if (this.matchesPattern(normalizedStep, ['click', 'press', 'tap'])) {
      const selector = this.extractSelector(step) || this.extractQuotedText(step);
      return {
        action: 'click',
        target: selector,
        originalStep: step
      };
    }
    
    // Type/Input patterns
    if (this.matchesPattern(normalizedStep, ['type', 'enter', 'input', 'fill'])) {
      const value = this.extractValue(step);
      const selector = this.extractSelector(step) || this.extractInputField(step);
      return {
        action: 'type',
        target: selector,
        value: value,
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
  
  private static extractSelector(step: string): string | undefined {
    // Look for CSS selectors or data attributes
    const patterns = [
      /#[\w-]+/, // ID selector
      /\.[\w-]+/, // Class selector
      /\[data-[\w-]+=["'].*?["']\]/, // Data attribute
      /\[.*?\]/, // General attribute
      /button|input|a|div|span|form/i // Element types
    ];
    
    for (const pattern of patterns) {
      const match = step.match(pattern);
      if (match) return match[0];
    }
    
    return undefined;
  }
  
  private static extractValue(step: string): string | undefined {
    // Extract value from common patterns
    const patterns = [
      /with ["'](.*?)["']/, // "with 'value'"
      /value ["'](.*?)["']/, // "value 'text'"
      /["'](.*?)["'](?=.*(?:into|in))/, // "'value' into field"
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
} 