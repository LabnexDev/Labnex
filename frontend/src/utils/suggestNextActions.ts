const suggestions: Record<string, string[]> = {
  createProject: [
    'Want to add test cases to this project?',
    'Should I open the dashboard now?',
    'Need to assign someone?'
  ],
  createTask: [
    'Want to add another task?',
    'Should I set a due date?',
    'Need to create a related test case?'
  ],
  createTestCase: [
    'Want to run this test now?',
    'Should I add another test case?',
    'Need to assign this to a tester?'
  ]
};

export function suggestNextActions(intent: string): string[] {
  return suggestions[intent] || [];
}

export function pickAndStoreSuggestion(intent: string): string | undefined {
  const list = suggestNextActions(intent);
  if (list.length === 0) return undefined;
  const text = list[Math.floor(Math.random()*list.length)];
  return text;
} 