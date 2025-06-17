export function parseRawSteps(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^(?:[-•]\s*|\d+[.)]?\s*|[A-Za-z][.)]\s*)/, '').trim());
} 