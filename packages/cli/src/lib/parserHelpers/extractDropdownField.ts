export function extractDropdownField(step: string): string | undefined {
  const dropdownFieldPattern = /(?:dropdown|select):\s*([^,\s]+)/i;
  const match = step.match(dropdownFieldPattern);
  if (match && match[1]) {
    return match[1].trim();
  }
  return undefined;
} 