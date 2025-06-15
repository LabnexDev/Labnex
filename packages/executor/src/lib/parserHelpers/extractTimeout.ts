export function extractTimeout(step: string): number | undefined {
  const timeoutPattern = /(?:timeout|wait):\s*(\d+)/i;
  const match = step.match(timeoutPattern);
  if (match && match[1]) {
    return parseInt(match[1].trim());
  }
  return undefined;
} 