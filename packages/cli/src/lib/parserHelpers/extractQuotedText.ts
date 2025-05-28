export function extractQuotedText(step: string): string | undefined {
  const quotedTextPattern = /(['"])(.*?)\1/;
  const match = step.match(quotedTextPattern);
  if (match && match[2]) {
    return match[2].trim();
  }
  return undefined;
} 