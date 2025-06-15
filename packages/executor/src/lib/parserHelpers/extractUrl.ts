export function extractUrl(step: string): string | undefined {
  const urlPattern = /(https?:\/\/[^\s]+)/;
  const match = step.match(urlPattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
} 