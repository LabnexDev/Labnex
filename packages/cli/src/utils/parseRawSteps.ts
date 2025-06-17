export function parseRawSteps(raw: string): string[] {
  return raw
    .split(/\r?\n/)                 // Windows or Unix line breaks
    .map((l) => l.trim())            // trim whitespace
    .filter(Boolean)                 // remove empty lines
    .map((line) =>
      line.replace(/^(?:[-•]\s*|\d+[.)]?\s*|[A-Za-z][.)]\s*)/, '').trim()
    );
} 