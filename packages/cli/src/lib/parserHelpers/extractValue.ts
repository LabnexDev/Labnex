export function extractValue(step: string): string | undefined {
  const valuePattern = /(?:value|text|content):\s*([^,\s]+)/i;
  const match = step.match(valuePattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
} 