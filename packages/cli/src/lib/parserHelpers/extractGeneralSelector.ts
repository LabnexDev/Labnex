export function extractGeneralSelector(step: string): string | undefined {
  const selectorPattern = /(css|xpath|id|name|text):\s*([^,\s]+)/i;
  const match = step.match(selectorPattern);
  if (match && match[2]) {
    return match[2].trim();
  }
  return undefined;
} 