const affirmations = [
  'yes', 'yeah', 'yep', 'sure', 'go ahead', 'do it', 'please do', 'absolutely', 'correct'
];

export function isAffirmative(text: string): boolean {
  const lower = text.toLowerCase();
  return affirmations.some(phrase => lower === phrase || lower.includes(phrase));
} 