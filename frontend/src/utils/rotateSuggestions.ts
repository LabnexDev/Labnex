const suggestions = [
  'Try saying: Create a project',
  'You can say: Add a task for login bug',
  'Say: Go to dashboard',
  'Say: Show all tests',
  'Try: Help'
];

export function getSuggestion(index: number): string {
  return suggestions[index % suggestions.length];
}

export function suggestionsCount() {
  return suggestions.length;
} 