export function extractScrollTarget(step: string): string | undefined {
  const scrollTargetPattern = /(?:scroll|scroll to):\s*([^,\s]+)/i;
  const match = step.match(scrollTargetPattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
} 