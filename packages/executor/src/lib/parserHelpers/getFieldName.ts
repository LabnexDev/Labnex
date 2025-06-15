export function getFieldName(pattern: RegExp): string {
  const src = pattern.source.toLowerCase();
  if (src.includes('username')) return 'username';
  if (src.includes('password')) return 'password';
  if (src.includes('email')) return 'email';
  if (src.includes('name')) return 'name';
  if (src.includes('phone')) return 'phone';
  if (src.includes('address')) return 'address';
  if (src.includes('search')) return 'search';
  return 'text';
}
