export function getFieldName(pattern: RegExp): string {
  const match = pattern.exec(pattern.toString());
  if (match && match[1]) {
    return match[1].trim();
  }
  return '';
} 