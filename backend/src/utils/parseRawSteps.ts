export function parseRawSteps(raw: string): string[] {
  return raw
    .split(/\r?\n/)                 // split on Windows or Unix line breaks
    .map((l) => l.trim())            // trim whitespace
    .filter(Boolean)                 // drop empty lines
    .map((line) =>
      // remove bullets like "1 ", "1.", "1)", "- ", "• ", "A) "
      line.replace(/^(?:[-•]\s*|\d+[.)]?\s*|[A-Za-z][.)]\s*)/, '').trim()
    );
} 