export function matchesPattern(step: string, keywords: string[]): boolean {
  return keywords.some(kw => step.toLowerCase().startsWith(kw + ' '));
} 