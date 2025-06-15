export function extractInputField(step: string): string | undefined {
  const inputFieldPattern = /(?:input|field):\s*([^,\s]+)/i;
  const match = step.match(inputFieldPattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
} 